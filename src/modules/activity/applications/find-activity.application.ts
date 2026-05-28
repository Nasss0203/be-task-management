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

@Injectable()
export class FindActivityApplicationImpl implements FindActivityApplication {
  constructor(
    @Inject(ACTIVITY_TYPES.services.FindActivityService)
    private readonly findActivityService: FindActivityService,
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

    return {
      items: ActivityMapper.toResponseList(result.items),
      nextCursor: result.nextCursor,
    };
  }
}
