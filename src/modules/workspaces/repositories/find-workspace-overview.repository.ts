import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { WorkspaceOverviewResponseDto } from '../dto/response/workspace-overview.response.dto';
import { FindWorkspaceOverviewRepository } from '../interfaces/repositories/find-workspace-overview.repository.interface';

type MetricsRaw = {
  members: number;
};

@Injectable()
export class FindWorkspaceOverviewRepositoryImpl implements FindWorkspaceOverviewRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewResponseDto> {
    const db = manager ?? this.dataSource.manager;

    const [metricsRaw] = await db.query<MetricsRaw[]>(
      `
        SELECT COUNT(*)::int AS "members"
        FROM workspace_members
        WHERE workspace_id = $1
      `,
      [workspaceId],
    );

    return {
      workspaceId,
      metrics: {
        projects: 0,
        openTasks: 0,
        overdueTasks: 0,
        members: Number(metricsRaw?.members ?? 0),
      },
      projects: [],
      attentions: [],
    };
  }
}
