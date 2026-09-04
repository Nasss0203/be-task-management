import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminUserRoleResponseDto } from '../../dto/response/admin-user-role.response.dto';
import type { AdminUserWriter } from '../../ports/admin-user-writer.port';
import { UpdateAdminUserRoleCommand } from './update-admin-user-role.command';

@Injectable()
export class UpdateAdminUserRoleHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.UserWriter)
    private readonly adminUserWriter: AdminUserWriter,
  ) {}

  async execute(
    command: UpdateAdminUserRoleCommand,
  ): Promise<AdminUserRoleResponseDto> {
    if (command.actorUserId === command.targetUserId) {
      throw new BadRequestException('You cannot change your own system role');
    }

    const result = await this.adminUserWriter.updateUserRole({
      userId: command.targetUserId,
      systemRole: command.systemRole,
    });

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return result;
  }
}
