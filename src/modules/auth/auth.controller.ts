import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type CookieOptions, type Request, type Response } from 'express';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import {
  AuthRateLimit,
  PublicReadRateLimit,
  ReadRateLimit,
  TokenRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SkipTransform } from 'src/common/decorator/skip.transform';
import { GoogleAuthGuard } from 'src/common/guard/google-auth.guard';
import { LocalAuthGuard } from 'src/common/guard/local-auth.guard';
import { type IAuth } from 'src/types/auth';
import { type GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { LoginUserDto, RegisterUserDto } from '../users/dto/create-user.dto';
import { type GetProfileAuthApplication } from './interfaces/applications/get-profile-auth.application.interface';
import { type GoogleAuthApplication } from './interfaces/applications/google-auth.application.interface';
import { type LoginAuthApplication } from './interfaces/applications/login-auth.application.interface';
import { type LogoutAuthApplication } from './interfaces/applications/logout-auth.application.interface';
import { type RefreshAuthApplication } from './interfaces/applications/refresh-auth.application.interface';
import { type RegisterAuthApplication } from './interfaces/applications/register-auth.application.interface';
import { IUserJwtPayload } from './interfaces/type';
import { AUTH_TYPES } from './interfaces/types';
import { AuthService } from './auth.service';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  VerifyActivationTokenDto,
  ActivateAdminDto,
} from './dto/activate-admin.dto';

type RefreshTokenRequest = Request & {
  cookies?: {
    refresh_token?: string;
  };
};

type RefreshTokenBody = {
  refresh_token?: string;
};

const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const REFRESH_TOKEN_COOKIE_CLEAR_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/v1/auth',
};

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_TYPES.applications.RegisterAuthApplication)
    private readonly registerAuthApplication: RegisterAuthApplication,
    @Inject(AUTH_TYPES.applications.LoginAuthApplication)
    private readonly loginAuthApplication: LoginAuthApplication,
    @Inject(AUTH_TYPES.applications.RefreshAuthApplication)
    private readonly refreshAuthApplication: RefreshAuthApplication,
    @Inject(AUTH_TYPES.applications.LogoutAuthApplication)
    private readonly logoutAuthApplication: LogoutAuthApplication,
    @Inject(AUTH_TYPES.applications.GetProfileAuthApplication)
    private readonly getProfileAuthApplication: GetProfileAuthApplication,
    @Inject(AUTH_TYPES.applications.GoogleAuthApplication)
    private readonly googleAuthApplication: GoogleAuthApplication,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Public()
  @AuthRateLimit()
  @ResponseMessage('Register user successfully!!')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.registerAuthApplication.register(registerUserDto);
  }

  @Public()
  @Post('login')
  @AuthRateLimit()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Login user successfully!!')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Auth() auth: IAuth,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.loginAuthApplication.login(auth);

    res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE_OPTIONS);

    return { access_token, refresh_token };
  }

  @Public()
  @Post('refresh')
  @TokenRateLimit()
  @ResponseMessage('Refresh token successfully!!')
  async refresh(
    @Req() req: RefreshTokenRequest,
    @Body() body: RefreshTokenBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const currentRefreshToken =
      body?.refresh_token || req.cookies?.refresh_token;
    const { access_token, refresh_token } =
      await this.refreshAuthApplication.refresh(currentRefreshToken);

    res.cookie('refresh_token', refresh_token, REFRESH_TOKEN_COOKIE_OPTIONS);

    return { access_token, refresh_token };
  }

  @Public()
  @Post('logout')
  @TokenRateLimit()
  @ResponseMessage('Logout successfully!!')
  async logout(
    @Req() req: RefreshTokenRequest,
    @Body() body: RefreshTokenBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const currentRefreshToken =
      body?.refresh_token || req.cookies?.refresh_token;

    const result = await this.logoutAuthApplication.logout(currentRefreshToken);

    res.clearCookie('refresh_token', REFRESH_TOKEN_COOKIE_CLEAR_OPTIONS);

    return result;
  }

  @Public()
  @Get('google')
  @PublicReadRateLimit()
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return;
  }

  @Public()
  @SkipTransform()
  @Get('google/callback')
  @AuthRateLimit()
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Auth() googleUser: GoogleUserPayload,
    @Res() res: Response,
  ): Promise<void> {
    const { access_token, refresh_token } =
      await this.googleAuthApplication.loginWithGoogle(googleUser);

    res.cookie('refresh_token', refresh_token, {
      ...REFRESH_TOKEN_COOKIE_OPTIONS,
      sameSite: 'lax',
    });

    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/callback?access_token=${access_token}&refresh_token=${refresh_token}`,
    );
  }

  @Get('me')
  @ReadRateLimit()
  @ResponseMessage('Get me')
  async getProfile(@Req() req: Request & { user: IUserJwtPayload }) {
    return this.getProfileAuthApplication.getProfile(req.user);
  }

  @Public()
  @Post('resend-verification')
  @AuthRateLimit()
  @ResponseMessage('Verification email resent')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerificationEmail(dto.email);
    return {
      message:
        'If the email exists and is not verified, a new link has been sent.',
    };
  }

  @Public()
  @Post('verify-email')
  @AuthRateLimit()
  @ResponseMessage('Email verified successfully')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyEmail(dto.token);

    if (result.refresh_token) {
      res.cookie(
        'refresh_token',
        result.refresh_token,
        REFRESH_TOKEN_COOKIE_OPTIONS,
      );
    }

    return result;
  }

  @Public()
  @Post('forgot-password')
  @AuthRateLimit()
  @ResponseMessage('Password reset email sent')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  @Public()
  @Post('reset-password')
  @AuthRateLimit()
  @ResponseMessage('Password reset successfully')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Get('verify-activation-token')
  @PublicReadRateLimit()
  @ResponseMessage('Activation token verified successfully')
  async verifyActivationToken(@Query() query: VerifyActivationTokenDto) {
    return this.authService.verifyActivationToken(query.token);
  }

  @Public()
  @Post('activate-admin')
  @AuthRateLimit()
  @ResponseMessage('Admin account activated successfully')
  async activateAdmin(
    @Body() dto: ActivateAdminDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.activateAdmin(
      dto.token,
      dto.password,
    );

    if (result.refresh_token) {
      res.cookie(
        'refresh_token',
        result.refresh_token,
        REFRESH_TOKEN_COOKIE_OPTIONS,
      );
    }

    return result;
  }
}
