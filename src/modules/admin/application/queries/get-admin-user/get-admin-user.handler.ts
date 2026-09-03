import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminUserDetailResponseDto } from '../../dto/response/admin-user-detail.response.dto';
import type { AdminUserReader } from '../../ports/admin-user-reader.port';
import { GetAdminUserQuery } from './get-admin-user.query';

@Injectable()
export class GetAdminUserHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.UserReader)
    private readonly adminUserReader: AdminUserReader,
  ) {}

  async execute(query: GetAdminUserQuery): Promise<AdminUserDetailResponseDto> {
    const user = await this.adminUserReader.findUserById(query.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
