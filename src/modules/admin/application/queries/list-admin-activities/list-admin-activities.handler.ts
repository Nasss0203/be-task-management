import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminActivityListResponseDto } from '../../dto/response/admin-activity-list.response.dto';
import type { AdminActivityReader } from '../../ports/admin-activity-reader.port';
import { ListAdminActivitiesQuery } from './list-admin-activities.query';

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_ACTIVITY_RANGE_DAYS = 7;
export const MAX_ACTIVITY_RANGE_DAYS = 90;

@Injectable()
export class ListAdminActivitiesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.ActivityReader)
    private readonly activityReader: AdminActivityReader,
  ) {}

  async execute(
    query: ListAdminActivitiesQuery,
  ): Promise<AdminActivityListResponseDto> {
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

    const result = await this.activityReader.listActivities({
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
