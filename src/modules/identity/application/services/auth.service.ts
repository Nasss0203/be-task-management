import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { hashIdentityPassword } from 'src/modules/identity/infrastructure/security/password/password-hasher';
import { MailService } from 'src/modules/mail/mail.service';
import { type UserRepository } from 'src/modules/identity/domain/repositories/user.repository';
import { IssueAuthTokenServiceImpl } from './issue-auth-token.service';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
    private readonly issueAuthTokenService: IssueAuthTokenServiceImpl,
    private readonly mailService: MailService,
  ) {}

  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return; // Silent fail
    if (user.isEmailVerified) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
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
    const user =
      await this.userRepository.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw new HttpException(
        {
          code: ErrorCode.INVALID_VERIFICATION_TOKEN,
          message: 'Invalid verification token',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.isActive) {
      throw new HttpException(
        {
          code: ErrorCode.USER_INACTIVE,
          message: 'User account is disabled or banned',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new HttpException(
        {
          code: ErrorCode.EMAIL_VERIFICATION_EXPIRED,
          message: 'Verification token expired',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.userRepository.save(user);

    const tokens = await this.issueAuthTokenService.issueTokens(user);

    return {
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    await this.userRepository.save(user);
    this.mailService
      .sendResetPasswordEmail({
        to: user.email,
        recipientName: user.username,
        resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`,
      })
      .catch(console.error);
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user =
      await this.userRepository.findByResetPasswordToken(hashedToken);

    if (!user) {
      throw new HttpException(
        { code: ErrorCode.INVALID_RESET_TOKEN, message: 'Invalid reset token' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new HttpException(
        { code: ErrorCode.RESET_TOKEN_EXPIRED, message: 'Reset token expired' },
        HttpStatus.BAD_REQUEST,
      );
    }

    user.passwordHash = hashIdentityPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);
    return { success: true };
  }

  async verifyActivationToken(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user =
      await this.userRepository.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw new HttpException(
        {
          code: ErrorCode.INVALID_VERIFICATION_TOKEN,
          message: 'Liên kết kích hoạt không hợp lệ hoặc không tồn tại.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new HttpException(
        {
          code: ErrorCode.EMAIL_VERIFICATION_EXPIRED,
          message: 'Liên kết kích hoạt đã hết hạn sử dụng.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      email: user.email,
      username: user.username,
    };
  }

  async activateAdmin(token: string, password: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user =
      await this.userRepository.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw new HttpException(
        {
          code: ErrorCode.INVALID_VERIFICATION_TOKEN,
          message: 'Liên kết kích hoạt không hợp lệ hoặc không tồn tại.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new HttpException(
        {
          code: ErrorCode.EMAIL_VERIFICATION_EXPIRED,
          message: 'Liên kết kích hoạt đã hết hạn sử dụng.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    user.passwordHash = hashIdentityPassword(password);
    user.isActive = true;
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await this.userRepository.save(user);

    const tokens = await this.issueAuthTokenService.issueTokens(user);

    return {
      success: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }
}
