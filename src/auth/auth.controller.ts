import { RefreshJwtGuard } from './../common/guards/refresh-jwt.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.signup(dto, {
      userAgent: req.headers['user-agent'],
      ip,
    });
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request, @Ip() ip: string) {
    return this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ip,
    });
  }

  // Guarded by a strategy that verifies the JWT signature with
  // JWT_REFRESH_SECRET and exposes { sub, sid } as request.user.
  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  refresh(
    @CurrentUser() user: { sub: string; sid: string },
    @Body('refreshToken') refreshToken: string,
  ) {
    return this.authService.refresh(user.sub, user.sid, refreshToken);
  }

  // Signs out only the device that made this request.
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: { sub: string; sid: string }) {
    return this.authService.logout(user.sub, user.sid);
  }

  // Signs out every device — useful after a password change or "sign out everywhere".
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@CurrentUser() user: { sub: string }) {
    return this.authService.logoutAllDevices(user.sub);
  }

  // Lets the user see which devices are currently signed in.
  @UseGuards(JwtAuthGuard)
  @Get('devices')
  listDevices(@CurrentUser() user: { sub: string }) {
    return this.authService.listDevices(user.sub);
  }

  // Revoke one specific device from the list (not necessarily the current one).
  @UseGuards(JwtAuthGuard)
  @Delete('devices/:sessionId')
  revokeDevice(
    @CurrentUser() user: { sub: string },
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.logout(user.sub, sessionId);
  }
}
