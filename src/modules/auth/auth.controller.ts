import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Response } from 'express';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Public } from 'src/common/decorator/public.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { LocalAuthGuard } from 'src/common/guard/local-auth.guard';
import { type IAuth } from 'src/types/auth';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
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
    const { access_token, refresn_token } = await this.authService.login(auth);

    res.cookie('refresh_token', refresn_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token, refresn_token };
  }

  @Get('me')
  @ResponseMessage('Get me')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user);
  }
}
