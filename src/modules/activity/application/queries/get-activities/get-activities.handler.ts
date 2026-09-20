import { Inject, Injectable } from '@nestjs/common';
import { type ActivityRepository } from '../../../domain/repositories/activity.repository';
import { ACTIVITY_TYPES } from '../../../activity.types';
import { ActivityResponseDto } from '../../dto/response/activity.response.dto';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { type FindUserService } from 'src/modules/identity/application/ports/find-user.service.interface';
import { GetActivitiesQuery } from './get-activities.query';

export type GetActivitiesResult = {
  items: ActivityResponseDto[];
  nextCursor: string | null;
};

@Injectable()
export class GetActivitiesHandler {
  constructor(
    @Inject(ACTIVITY_TYPES.repositories.ActivityRepository)
    private readonly activityRepository: ActivityRepository,
    @Inject(IDENTITY_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,
  ) {}

  async execute(query: GetActivitiesQuery): Promise<GetActivitiesResult> {
    const filters = {
      ...query.filters,
      workspaceId: query.workspaceId,
      ...query.scope,
    };
    const result = await this.activityRepository.findMany({
      workspaceId: filters.workspaceId,
      projectId: filters.projectId,
      entityType: filters.entityType,
      entityId: filters.entityId,
      actorId: filters.actorId,
      action: filters.action,
      cursor: filters.cursor,
      limit: filters.limit ? Number(filters.limit) : undefined,
    });

    const items = result.items.map((activity) =>
      ActivityResponseDto.fromModel(activity),
    );

    const actorIds = [
      ...new Set(items.map((item) => item.actorId).filter((id) => !!id)),
    ] as string[];
    const users = await Promise.all(
      actorIds.map((id) => this.findUserService.findUserById(id)),
    );
    const userMap = new Map(users.filter((u) => !!u).map((u) => [u.id, u]));

    items.forEach((item) => {
      if (item.actorId && userMap.has(item.actorId)) {
        const user = userMap.get(item.actorId)!;
        item.actor = {
          id: user.id,
          username: user.username,
          email: user.email,
        };
      }
    });

    return {
      items,
      nextCursor: result.nextCursor,
    };
  }
}
