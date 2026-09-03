import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminUserListResponseDto } from '../../dto/response/admin-user-list.response.dto';
import type { AdminUserReader } from '../../ports/admin-user-reader.port';
import { ListAdminUsersQuery } from './list-admin-users.query';

@Injectable()
export class ListAdminUsersHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.UserReader)
    private readonly adminUserReader: AdminUserReader,
  ) {}

  async execute(query: ListAdminUsersQuery): Promise<AdminUserListResponseDto> {
    const result = await this.adminUserReader.listUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
    };
  }
}
