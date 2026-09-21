import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface RefreshJwtPayload {
  sub: string;
  email: string;
  sid: string; // session id — identifies exactly which device this token belongs to
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req.body?.refreshToken, // client sends it in the request body
      ]),
      secretOrKey: refreshSecret,
      ignoreExpiration: false,
    });
  }

  validate(payload: RefreshJwtPayload) {
    // Becomes request.user in the controller. Actual token/session matching
    // (comparing against the stored hash) happens in AuthService.refresh —
    // this strategy only confirms the JWT signature and expiry are valid.
    return { sub: payload.sub, email: payload.email, sid: payload.sid };
  }
}