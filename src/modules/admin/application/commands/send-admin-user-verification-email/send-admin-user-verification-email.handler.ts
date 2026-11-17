import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from 'src/modules/identity/application/services/auth.service';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminUserEmailSentResponseDto } from '../../dto/response/admin-user-email-sent.response.dto';
import type { AdminUserReader } from '../../ports/admin-user-reader.port';
import { SendAdminUserVerificationEmailCommand } from './send-admin-user-verification-email.command';

@Injectable()
export class SendAdminUserVerificationEmailHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.UserReader)
    private readonly adminUserReader: AdminUserReader,
    private readonly authService: AuthService,
  ) {}

  async execute(
    command: SendAdminUserVerificationEmailCommand,
  ): Promise<AdminUserEmailSentResponseDto> {
    const user = await this.adminUserReader.findUserById(command.targetUserId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('User account is suspended');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('User email is already verified');
    }

    await this.authService.resendVerificationEmail(user.email);

    return { sent: true };
  }
}
