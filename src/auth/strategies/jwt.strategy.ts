import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface AccessJwtPayload {
  sub: string;
  email: string;
  sid: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const accessSecret = configService.get<string>('JWT_ACCESS_SECRET');

    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // was 'JWT_SECRET' — must match what AuthService signs access tokens with
      secretOrKey: accessSecret,
      ignoreExpiration: false,
    });
  }

  validate(payload: AccessJwtPayload) {
    return { sub: payload.sub, email: payload.email, sid: payload.sid };
  }
}
