import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminLoginAttemptListResponseDto } from '../../dto/response/admin-login-attempt-list.response.dto';
import type { AdminSessionReader } from '../../ports/admin-session-reader.port';
import { ListAdminLoginAttemptsQuery } from './list-admin-login-attempts.query';

@Injectable()
export class ListAdminLoginAttemptsHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.SessionReader)
    private readonly sessionReader: AdminSessionReader,
  ) {}

  async execute(
    query: ListAdminLoginAttemptsQuery,
  ): Promise<AdminLoginAttemptListResponseDto> {
    const result = await this.sessionReader.listLoginAttempts({
      page: query.page,
      limit: query.limit,
      result: query.result,
      method: query.method,
      search: query.search,
      userId: query.userId,
    });

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
      since: result.since,
    };
  }
}
