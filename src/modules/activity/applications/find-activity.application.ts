import { Inject, Injectable } from '@nestjs/common';
import { FindActivityQueryDto } from '../dto/find-activity-query.dto';
import { ActivityEntityType } from '../domain/entities/activity.entity';
import {
  FindActivityApplication,
  FindActivityResponse,
} from '../interfaces/applications/find-activity.application.interface';
import { type FindActivityService } from '../interfaces/services/find-activity.service.interface';
import { ACTIVITY_TYPES } from '../interfaces/types';
import { ActivityMapper } from '../mapper/activity.mapper';
import { USER_TYPES } from '../../users/interfaces/types';
import { type FindUserService } from '../../users/interfaces/services/find-user.service.interface';

@Injectable()
export class FindActivityApplicationImpl implements FindActivityApplication {
  constructor(
    @Inject(ACTIVITY_TYPES.services.FindActivityService)
    private readonly findActivityService: FindActivityService,
    @Inject(USER_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,
  ) {}

  async findByWorkspace(
    workspaceId: string,
    query: FindActivityQueryDto,
  ): Promise<FindActivityResponse> {
    return this.find({
      ...query,
      workspaceId,
    });
  }

  async findByProject(
    workspaceId: string,
    projectId: string,
    query: FindActivityQueryDto,
  ): Promise<FindActivityResponse> {
    return this.find({
      ...query,
      workspaceId,
      projectId,
    });
  }

  async findByEntity(
    workspaceId: string,
    entityType: ActivityEntityType,
    entityId: string,
    query: FindActivityQueryDto,
  ): Promise<FindActivityResponse> {
    return this.find({
      ...query,
      workspaceId,
      entityType,
      entityId,
    });
  }

  private async find(
    filters: FindActivityQueryDto & { workspaceId: string },
  ): Promise<FindActivityResponse> {
    const result = await this.findActivityService.findMany({
      workspaceId: filters.workspaceId,
      projectId: filters.projectId,
      entityType: filters.entityType,
      entityId: filters.entityId,
      actorId: filters.actorId,
      action: filters.action,
      cursor: filters.cursor,
      limit: filters.limit ? Number(filters.limit) : undefined,
    });

    const items = ActivityMapper.toResponseList(result.items);

    const actorIds = [...new Set(items.map(item => item.actorId).filter(id => !!id))] as string[];
    const users = await Promise.all(actorIds.map(id => this.findUserService.findUserById(id)));
    const userMap = new Map(users.filter(u => !!u).map(u => [u!.id, u]));

    items.forEach(item => {
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
