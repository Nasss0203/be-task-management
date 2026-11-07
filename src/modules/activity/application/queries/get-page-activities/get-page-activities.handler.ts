import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { ActivityEntityType } from '../../../domain/entities/activity.entity';
import {
  GetActivitiesHandler,
  GetActivitiesResult,
} from '../get-activities/get-activities.handler';
import { GetActivitiesQuery } from '../get-activities/get-activities.query';
import { GetPageActivitiesQuery } from './get-page-activities.query';

@Injectable()
export class GetPageActivitiesHandler {
  constructor(
    private readonly getActivitiesHandler: GetActivitiesHandler,
    private readonly authorizationService: AuthorizationService,
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

    return this.getActivitiesHandler.execute(
      new GetActivitiesQuery(
        query.workspaceId,
        { cursor: query.cursor, limit: query.limit },
        {
          pageId: query.pageId,
          excludeEntityTypes: [ActivityEntityType.COMMENT],
        },
      ),
    );
  }
}
