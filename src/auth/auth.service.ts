import { DeviceMeta } from './../common/interfaces/device.inerface';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AppException } from '../common/exceptions/app.exception';
import { SessionsService } from './session/session.service';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto, meta?: DeviceMeta) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new AppException('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.usersService.create({
      nameEn: dto.nameEn.trim(),
      nameAr: dto.nameAr.trim(),
      email,
      password: passwordHash,
    });

    const tokens = await this.issueTokensForNewSession(
      user._id.toString(),
      user.email,
      meta,
    );

    return {
      user: {
        id: user._id,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        ...tokens,
      },
    };
  }

  async login(dto: LoginDto, meta?: DeviceMeta) {
    const email = dto.email.toLowerCase().trim();

    // password must be selected explicitly since the schema hides it by default
    const user = await this.usersService.findByEmailWithPassword(email);
    const isMatch = user && (await bcrypt.compare(dto.password, user.password));

    if (!user || !isMatch) {
      throw new AppException('INVALID_CREDENTIALS');
    }

    const tokens = await this.issueTokensForNewSession(
      user._id.toString(),
      user.email,
      meta,
    );

    return {
      user: {
        id: user._id,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        ...tokens,
      },
    };
  }

  /**
   * Called with the refresh token from the client. Verifies it against the
   * exact session (device) it belongs to, then rotates both tokens.
   * Other devices' sessions are untouched — this is the core of multi-device support.
   */
  async refresh(userId: string, sessionId: string, refreshToken: string) {
    const session = await this.sessionsService.verify(sessionId, refreshToken);
    if (!session) {
      throw new AppException('INVALID_REFRESH_TOKEN');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new AppException('USER_NOT_FOUND');
    }

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      sessionId,
    );
    await this.sessionsService.rotate(sessionId, tokens.refreshToken);

    return tokens;
  }

  /** Logs out the CURRENT device only. */
  async logout(userId: string, sessionId: string) {
    const session = await this.sessionsService.findById(sessionId);

    if (!session) {
      throw new AppException('UNAUTHORIZED');
    }

    if (session.userId.toString() !== userId) {
      throw new AppException('UNAUTHORIZED');
    }

    await this.sessionsService.revoke(sessionId);
    return {
      message: {
        en: 'Logged out successfully.',
        ar: 'تم تسجيل الخروج بنجاح.',
      },
    };
  }

  /** Logs out EVERY device for this user. */
  async logoutAllDevices(userId: string) {
    await this.sessionsService.revokeAllForUser(userId);
    return {
      message: {
        en: 'All devices were logged out successfully.',
        ar: 'تم تسجيل الخروج من جميع الأجهزة بنجاح.',
      },
    };
  }

  /** Lets the user see and manage which devices are signed in. */
  async listDevices(userId: string) {
    const sessions = await this.sessionsService.listForUser(userId);
    return sessions.map((s) => ({
      id: s._id,
      deviceName: s.deviceName,
      lastUsedAt: s.lastUsedAt,
      createdAt: (s as any).createdAt,
    }));
  }

  private async issueTokensForNewSession(
    userId: string,
    email: string,
    meta?: DeviceMeta,
  ) {
    // sessionId must exist before signing the access/refresh tokens because
    // it gets embedded in them as the `sid` claim.
    const session = await this.sessionsService.create(
      userId,
      'placeholder',
      meta,
    );
    const tokens = await this.generateTokens(
      userId,
      email,
      session._id.toString(),
    );

    // Now that we have the real refresh token, store its hash (overwrite the placeholder).
    await this.sessionsService.rotate(
      session._id.toString(),
      tokens.refreshToken,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    sessionId: string,
  ) {
    const payload = { sub: userId, email, sid: sessionId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
