import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ACTIVITY_TYPES } from '../../../activity.types';
import { ActivityEntityType } from '../../../domain/entities/activity.entity';
import type { PageActivityDetailsReader } from '../../ports/page-activity-details.reader.port';
import {
  GetActivitiesHandler,
  GetActivitiesResult,
} from '../get-activities/get-activities.handler';
import { GetActivitiesQuery } from '../get-activities/get-activities.query';
import { activityTarget, activityTargetRequest } from './activity-targets';
import { GetPageActivitiesQuery } from './get-page-activities.query';

@Injectable()
export class GetPageActivitiesHandler {
  constructor(
    private readonly getActivitiesHandler: GetActivitiesHandler,
    private readonly authorizationService: AuthorizationService,
    @Inject(ACTIVITY_TYPES.ports.PageActivityDetailsReader)
    private readonly detailsReader: PageActivityDetailsReader,
  ) {}

  async execute(query: GetPageActivitiesQuery): Promise<GetActivitiesResult> {
    const canReadActivity = await this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.ACTIVITY_READ],
      target: { type: 'workspace', id: query.workspaceId },
    });

    if (!canReadActivity) {
      throw new ForbiddenException('You do not have required permissions');
    }

    const result = await this.getActivitiesHandler.execute(
      new GetActivitiesQuery(
        query.workspaceId,
        { cursor: query.cursor, limit: query.limit },
        {
          pageId: query.pageId,
          excludeEntityTypes: [ActivityEntityType.COMMENT],
        },
      ),
    );

    const names = await this.detailsReader.findNames(
      activityTargetRequest(result.items),
    );
    result.items.forEach((item) => {
      item.target = activityTarget(item, names);
    });

    return result;
  }
}
