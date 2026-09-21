import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
 
/**
 * Guards routes that expect a refresh token instead of an access token.
 * Delegates to RefreshJwtStrategy (registered under the 'jwt-refresh' name),
 * which verifies the signature with JWT_REFRESH_SECRET and populates
 * request.user with { sub, email, sid }.
 *
 * Usage:
 *   @Public()                    // bypasses the global access-token guard
 *   @UseGuards(RefreshJwtGuard)  // but still requires a valid refresh token
 *   @Post('refresh')
 *   refresh(@CurrentUser() user: CurrentUserPayload, @Body('refreshToken') token: string) {
 *     return this.authService.refresh(user.sub, user.sid, token);
 *   }
 */
@Injectable()
export class RefreshJwtGuard extends AuthGuard('jwt-refresh') {}
 