import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SkipTransform } from 'src/common/decorator/skip.transform';
import { GoogleAuthGuard } from 'src/common/guard/google-auth.guard';
import { LocalAuthGuard } from 'src/common/guard/local-auth.guard';
import { type IAuth } from 'src/types/auth';
import { type GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { IUserJwtPayload } from './interfaces/type';
import { AuthGoogleService } from './services/auth-google.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authGoogleService: AuthGoogleService,
  ) {}

  @Post('register')
  @Public()
  @ResponseMessage('Register user successfully!!')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Login user successfully!!')
  async login(@Auth() auth: IAuth, @Res({ passthrough: true }) res: Response) {
    const { access_token, refresh_token } = await this.authService.login(auth);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token, refresh_token };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return;
  }

  @Public()
  @SkipTransform()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Auth() googleUser: GoogleUserPayload,
    @Res() res: Response,
  ): Promise<void> {
    const { access_token, refresh_token } =
      await this.authGoogleService.loginWithGoogle(googleUser);

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`http://localhost:3000/callback?access_token=${access_token}`);
  }

  @Get('me')
  @ResponseMessage('Get me')
  async getProfile(@Req() req: Request & { user: IUserJwtPayload }) {
    return this.authService.getProfile(req.user);
  }
}
