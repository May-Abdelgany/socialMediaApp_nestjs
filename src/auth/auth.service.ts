import { Injectable } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim();

    const existingUser =
      await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new AppException('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.SALT_ROUNDS,
    );

    const user = await this.usersService.create({
      nameEn: dto.nameEn.trim(),
      nameAr: dto.nameAr.trim(),
      email,
      password: passwordHash,
    });

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
    );

    const refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      this.SALT_ROUNDS,
    );

    await this.usersService.updateRefreshToken(
      user._id.toString(),
      refreshTokenHash,
    );

    return {
      user: {
        id: user._id,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },

      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
  ) {
    const payload = {
      sub: userId,
      email,
    };

    const [accessToken, refreshToken] =
      await Promise.all([
        this.jwtService.signAsync(payload, {
          secret: process.env.JWT_ACCESS_SECRET,
          expiresIn: '15m',
        }),

        this.jwtService.signAsync(payload, {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        }),
      ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}