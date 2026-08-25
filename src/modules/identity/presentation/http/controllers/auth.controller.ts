import {
  Body,
  Controller,
  Get,
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
import {
  LoginUserDto,
  RegisterUserDto,
} from 'src/modules/identity/application/dto/user/create-user.dto';
import { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';
import { AuthService } from 'src/modules/identity/application/services/auth.service';
import { GetProfileAuthHandler } from 'src/modules/identity/application/queries/get-profile-auth/get-profile-auth.handler';
import { GetProfileAuthQuery } from 'src/modules/identity/application/queries/get-profile-auth/get-profile-auth.query';
import { GoogleAuthCommand } from 'src/modules/identity/application/commands/google-auth/google-auth.command';
import { GoogleAuthHandler } from 'src/modules/identity/application/commands/google-auth/google-auth.handler';
import { LoginAuthCommand } from 'src/modules/identity/application/commands/login-auth/login-auth.command';
import { LoginAuthHandler } from 'src/modules/identity/application/commands/login-auth/login-auth.handler';
import {
  LogoutAuthResult,
  LogoutAuthHandler,
} from 'src/modules/identity/application/commands/logout-auth/logout-auth.handler';
import { LogoutAuthCommand } from 'src/modules/identity/application/commands/logout-auth/logout-auth.command';
import { AuthTokenPair } from 'src/modules/identity/application/services/issue-auth-token.service';
import { RefreshAuthCommand } from 'src/modules/identity/application/commands/refresh-auth/refresh-auth.command';
import { RefreshAuthHandler } from 'src/modules/identity/application/commands/refresh-auth/refresh-auth.handler';
import { RegisterAuthCommand } from 'src/modules/identity/application/commands/register-auth/register-auth.command';
import { RegisterAuthHandler } from 'src/modules/identity/application/commands/register-auth/register-auth.handler';
import { ResendVerificationDto } from 'src/modules/identity/application/dto/auth/resend-verification.dto';
import { VerifyEmailDto } from 'src/modules/identity/application/dto/auth/verify-email.dto';
import { ForgotPasswordDto } from 'src/modules/identity/application/dto/auth/forgot-password.dto';
import { ResetPasswordDto } from 'src/modules/identity/application/dto/auth/reset-password.dto';
import {
  VerifyActivationTokenDto,
  ActivateAdminDto,
} from 'src/modules/identity/application/dto/auth/activate-admin.dto';

type RefreshTokenRequest = Omit<Request, 'cookies'> & {
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
    private readonly registerAuthHandler: RegisterAuthHandler,
    private readonly loginAuthHandler: LoginAuthHandler,
    private readonly refreshAuthHandler: RefreshAuthHandler,
    private readonly logoutAuthHandler: LogoutAuthHandler,
    private readonly getProfileAuthHandler: GetProfileAuthHandler,
    private readonly googleAuthHandler: GoogleAuthHandler,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Public()
  @AuthRateLimit()
  @ResponseMessage('Register user successfully!!')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.registerAuthHandler.execute(
      new RegisterAuthCommand(registerUserDto),
    );
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
    const { access_token, refresh_token } = await this.loginAuthHandler.execute(
      new LoginAuthCommand(auth),
    );

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
    const { access_token, refresh_token }: AuthTokenPair =
      await this.refreshAuthHandler.execute(
        new RefreshAuthCommand(currentRefreshToken),
      );

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

    const result: LogoutAuthResult = await this.logoutAuthHandler.execute(
      new LogoutAuthCommand(currentRefreshToken),
    );

    res.clearCookie('refresh_token', REFRESH_TOKEN_COOKIE_CLEAR_OPTIONS);

    return result;
  }

  @Public()
  @Get('google')
  @PublicReadRateLimit()
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
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
      await this.googleAuthHandler.execute(new GoogleAuthCommand(googleUser));

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
    return this.getProfileAuthHandler.execute(
      new GetProfileAuthQuery(req.user),
    );
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
