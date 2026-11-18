import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminActionListResponseDto } from '../../dto/response/admin-action-list.response.dto';
import type { AdminActionReader } from '../../ports/admin-action-reader.port';
import {
  DEFAULT_ACTIVITY_RANGE_DAYS,
  MAX_ACTIVITY_RANGE_DAYS,
} from '../list-admin-activities/list-admin-activities.handler';
import { ListAdminActionsQuery } from './list-admin-actions.query';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ListAdminActionsHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.ActionReader)
    private readonly actionReader: AdminActionReader,
  ) {}

  async execute(
    query: ListAdminActionsQuery,
  ): Promise<AdminActionListResponseDto> {
    const { from, to, ...filters } = query.filters;
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - DEFAULT_ACTIVITY_RANGE_DAYS * DAY_MS);

    if (fromDate > toDate) {
      throw new BadRequestException('from must be before to');
    }

    if (
      toDate.getTime() - fromDate.getTime() >
      MAX_ACTIVITY_RANGE_DAYS * DAY_MS
    ) {
      throw new BadRequestException(
        `Date range must not exceed ${MAX_ACTIVITY_RANGE_DAYS} days`,
      );
    }

    const result = await this.actionReader.listActions({
      page: query.page,
      limit: query.limit,
      from: fromDate,
      to: toDate,
      ...filters,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
      from: fromDate,
      to: toDate,
    };
  }
}
