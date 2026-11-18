import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminSessionListResponseDto } from '../../dto/response/admin-session-list.response.dto';
import type { AdminSessionReader } from '../../ports/admin-session-reader.port';
import { ListAdminSessionsQuery } from './list-admin-sessions.query';

@Injectable()
export class ListAdminSessionsHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.SessionReader)
    private readonly sessionReader: AdminSessionReader,
  ) {}

  async execute(
    query: ListAdminSessionsQuery,
  ): Promise<AdminSessionListResponseDto> {
    const result = await this.sessionReader.listSessions({
      page: query.page,
      limit: query.limit,
      search: query.search,
      systemRole: query.systemRole,
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
