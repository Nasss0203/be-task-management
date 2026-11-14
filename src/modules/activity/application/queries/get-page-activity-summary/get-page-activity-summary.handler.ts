import { Inject, Injectable } from '@nestjs/common';
import { ACTIVITY_TYPES } from '../../../activity.types';
import type { ActivityActorResponseDto } from '../../dto/response/activity.response.dto';
import type { PageActivityDetailsReader } from '../../ports/page-activity-details.reader.port';
import { GetPageActivitiesHandler } from '../get-page-activities/get-page-activities.handler';
import { GetPageActivitiesQuery } from '../get-page-activities/get-page-activities.query';
import { GetPageActivitySummaryQuery } from './get-page-activity-summary.query';

type PageActivityMoment = {
  actor: ActivityActorResponseDto | null;
  at: Date;
};

export type PageActivitySummary = {
  lastEdited: PageActivityMoment | null;
  created: PageActivityMoment | null;
};

@Injectable()
export class GetPageActivitySummaryHandler {
  constructor(
    private readonly getPageActivitiesHandler: GetPageActivitiesHandler,
    @Inject(ACTIVITY_TYPES.ports.PageActivityDetailsReader)
    private readonly detailsReader: PageActivityDetailsReader,
  ) {}

  async execute(
    query: GetPageActivitySummaryQuery,
  ): Promise<PageActivitySummary> {
    const { items } = await this.getPageActivitiesHandler.execute(
      new GetPageActivitiesQuery(
        query.userId,
        query.workspaceId,
        query.pageId,
        undefined,
        '1',
      ),
    );
    const latest = items[0];
    const creation = await this.detailsReader.findPageCreation(query.pageId);
    const creatorNames = creation?.createdBy
      ? await this.detailsReader.findNames({
          rowIds: [],
          propertyIds: [],
          optionIds: [],
          userIds: [creation.createdBy],
        })
      : null;
    const creatorId = creation?.createdBy ?? null;

    return {
      lastEdited: latest
        ? { actor: latest.actor ?? null, at: latest.createdAt }
        : null,
      created: creation
        ? {
            actor:
              creatorId && creatorNames?.users.has(creatorId)
                ? {
                    id: creatorId,
                    username: creatorNames.users.get(creatorId) ?? null,
                  }
                : null,
            at: creation.createdAt,
          }
        : null,
    };
  }
}
