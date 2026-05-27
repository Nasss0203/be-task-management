import { ActivityResponseDto } from '../../dto/response/activity.response.dto';
import { FindActivityQueryDto } from '../../dto/find-activity-query.dto';
import { ActivityEntityType } from '../../domain/entities/activity.entity';

export type FindActivityResponse = {
  items: ActivityResponseDto[];
  nextCursor: string | null;
};

export interface FindActivityApplication {
  findByWorkspace(
    workspaceId: string,
    query: FindActivityQueryDto,
  ): Promise<FindActivityResponse>;

  findByProject(
    workspaceId: string,
    projectId: string,
    query: FindActivityQueryDto,
  ): Promise<FindActivityResponse>;

  findByEntity(
    workspaceId: string,
    entityType: ActivityEntityType,
    entityId: string,
    query: FindActivityQueryDto,
  ): Promise<FindActivityResponse>;
}
