import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { hashPassword } from 'src/utils';
import { IAuth } from 'src/types/auth';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { type GetProfileAuthApplication } from './interfaces/applications/get-profile-auth.application.interface';
import { type LoginAuthApplication } from './interfaces/applications/login-auth.application.interface';
import { type LogoutAuthApplication } from './interfaces/applications/logout-auth.application.interface';
import { type RefreshAuthApplication } from './interfaces/applications/refresh-auth.application.interface';
import { type RegisterAuthApplication } from './interfaces/applications/register-auth.application.interface';
import { IUserJwtPayload } from './interfaces/type';
import { type ValidateUserAuthService } from './interfaces/services/validate-user-auth.service.interface';
import { AUTH_TYPES } from './interfaces/types';
import { type AuthUserRepository } from './interfaces/repositories/auth-user.repository.interface';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
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
    @Inject(AUTH_TYPES.services.ValidateUserAuthService)
    private readonly validateUserAuthService: ValidateUserAuthService,
    @Inject(AUTH_TYPES.repositories.AuthUserRepository)
    private readonly userRepository: AuthUserRepository,
    private readonly mailService: MailService,
  ) { }

  register(registerUserDto: RegisterUserDto) {
    return this.registerAuthApplication.register(registerUserDto);
  }

  login(auth: IAuth) {
    return this.loginAuthApplication.login(auth);
  }

  refresh(refreshToken?: string) {
    return this.refreshAuthApplication.refresh(refreshToken);
  }

  logout(refreshToken?: string) {
    return this.logoutAuthApplication.logout(refreshToken);
  }

  validateUser(email: string, password: string) {
    return this.validateUserAuthService.validateUser(email, password);
  }

  comparePassword(password: string, hash: string) {
    return this.validateUserAuthService.comparePassword(password, hash);
  }

  getProfile(payload: IUserJwtPayload) {
    return this.getProfileAuthApplication.getProfile(payload);
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return; // Silent fail
    if (user.isEmailVerified) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expires;
    await this.userRepository.save(user);

    await this.mailService.sendVerificationEmail({
      to: user.email,
      recipientName: user.username,
      verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`,
    });
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw new HttpException({ code: ErrorCode.INVALID_VERIFICATION_TOKEN, message: 'Invalid verification token' }, HttpStatus.BAD_REQUEST);
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new HttpException({ code: ErrorCode.EMAIL_VERIFICATION_EXPIRED, message: 'Verification token expired' }, HttpStatus.BAD_REQUEST);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.userRepository.save(user);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    const res = await this.userRepository.save(user);
    this.mailService.sendResetPasswordEmail({
      to: user.email,
      recipientName: user.username,
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`,
    }).catch(console.error);
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findByResetPasswordToken(hashedToken);

    if (!user) {
      throw new HttpException({ code: ErrorCode.INVALID_RESET_TOKEN, message: 'Invalid reset token' }, HttpStatus.BAD_REQUEST);
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new HttpException({ code: ErrorCode.RESET_TOKEN_EXPIRED, message: 'Reset token expired' }, HttpStatus.BAD_REQUEST);
    }

    user.passwordHash = hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);
    return { success: true };
  }
}
