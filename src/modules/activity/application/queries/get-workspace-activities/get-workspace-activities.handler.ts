import { Inject, Injectable } from '@nestjs/common';
import { ACTIVITY_TYPES } from '../../../activity.types';
import { ActivityEntityType } from '../../../domain/entities/activity.entity';
import type { PageActivityDetailsReader } from '../../ports/page-activity-details.reader.port';
import {
  GetActivitiesHandler,
  GetActivitiesResult,
} from '../get-activities/get-activities.handler';
import { GetActivitiesQuery } from '../get-activities/get-activities.query';
import {
  activityTarget,
  activityTargetRequest,
} from '../get-page-activities/activity-targets';
import { GetWorkspaceActivitiesQuery } from './get-workspace-activities.query';

@Injectable()
export class GetWorkspaceActivitiesHandler {
  constructor(
    private readonly getActivitiesHandler: GetActivitiesHandler,
    @Inject(ACTIVITY_TYPES.ports.PageActivityDetailsReader)
    private readonly detailsReader: PageActivityDetailsReader,
  ) {}

  async execute(
    query: GetWorkspaceActivitiesQuery,
  ): Promise<GetActivitiesResult> {
    const result = await this.getActivitiesHandler.execute(
      new GetActivitiesQuery(query.workspaceId, query.filters, {
        readableByUserId: query.userId,
        excludeEntityTypes: [ActivityEntityType.COMMENT],
      }),
    );

    const pageIds = result.items
      .map((item) => item.pageId)
      .filter((pageId): pageId is string => pageId !== null);
    const [names, pages] = await Promise.all([
      this.detailsReader.findNames(activityTargetRequest(result.items)),
      this.detailsReader.findPages(pageIds),
    ]);

    result.items.forEach((item) => {
      item.target = activityTarget(item, names);
      item.page = (item.pageId && pages.get(item.pageId)) || null;
    });

    return result;
  }
}
