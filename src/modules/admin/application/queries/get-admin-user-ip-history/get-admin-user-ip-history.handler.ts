import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import type {
  AdminSessionReader,
  AdminUserIpHistory,
} from '../../ports/admin-session-reader.port';
import { GetAdminUserIpHistoryQuery } from './get-admin-user-ip-history.query';

@Injectable()
export class GetAdminUserIpHistoryHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.SessionReader)
    private readonly sessionReader: AdminSessionReader,
  ) {}

  async execute(
    query: GetAdminUserIpHistoryQuery,
  ): Promise<AdminUserIpHistory> {
    const history = await this.sessionReader.getUserIpHistory(query.userId);

    if (!history) {
      throw new NotFoundException('User not found');
    }

    return history;
  }
}
