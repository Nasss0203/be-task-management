import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminUserStatusResponseDto } from '../../dto/response/admin-user-status.response.dto';
import type { AdminUserWriter } from '../../ports/admin-user-writer.port';
import { UpdateAdminUserStatusCommand } from './update-admin-user-status.command';

@Injectable()
export class UpdateAdminUserStatusHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.UserWriter)
    private readonly adminUserWriter: AdminUserWriter,
  ) {}

  async execute(
    command: UpdateAdminUserStatusCommand,
  ): Promise<AdminUserStatusResponseDto> {
    if (command.actorUserId === command.targetUserId && !command.isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const result = await this.adminUserWriter.updateUserStatus({
      userId: command.targetUserId,
      isActive: command.isActive,
    });

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return result;
  }
}
