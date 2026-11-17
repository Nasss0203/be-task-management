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
import { SendAdminUserPasswordResetEmailCommand } from './send-admin-user-password-reset-email.command';

@Injectable()
export class SendAdminUserPasswordResetEmailHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.UserReader)
    private readonly adminUserReader: AdminUserReader,
    private readonly authService: AuthService,
  ) {}

  async execute(
    command: SendAdminUserPasswordResetEmailCommand,
  ): Promise<AdminUserEmailSentResponseDto> {
    const user = await this.adminUserReader.findUserById(command.targetUserId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new BadRequestException('User account is suspended');
    }

    if (!user.hasPassword) {
      throw new BadRequestException('User has no local password');
    }

    await this.authService.forgotPassword(user.email);

    return { sent: true };
  }
}
