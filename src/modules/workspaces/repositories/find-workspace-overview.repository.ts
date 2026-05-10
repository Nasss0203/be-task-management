import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  ProjectHealthStatus,
  WorkspaceAttentionItemDto,
  WorkspaceOverviewResponseDto,
} from '../dto/response/workspace-overview.response.dto';
import { FindWorkspaceOverviewRepository } from '../interfaces/repositories/find-workspace-overview.repository.interface';

@Injectable()
export class FindWorkspaceOverviewRepositoryImpl implements FindWorkspaceOverviewRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewResponseDto> {
    const db = manager ?? this.dataSource.manager;

    const [metricsRaw] = await db.query(
      `
      SELECT
        (
          SELECT COUNT(*)::int
          FROM projects p
          WHERE p.workspace_id = $1
            AND p.deleted_at IS NULL
        ) AS "projects",

        (
          SELECT COUNT(*)::int
          FROM tasks t
          WHERE t.workspace_id = $1
            AND t.deleted_at IS NULL
            AND t.completed_at IS NULL
        ) AS "openTasks",

        (
          SELECT COUNT(*)::int
          FROM tasks t
          WHERE t.workspace_id = $1
            AND t.deleted_at IS NULL
            AND t.completed_at IS NULL
            AND t.due_at IS NOT NULL
            AND t.due_at < NOW()
        ) AS "overdueTasks",

        (
          SELECT COUNT(*)::int
          FROM user_workspaces uw
          WHERE uw.workspace_id = $1
        ) AS "members"
      `,
      [workspaceId],
    );

    const projectRaws = await db.query(
      `
  SELECT
    p.id AS "id",
    p.name AS "name",
    NULL AS "code",

    COUNT(t.id)::int AS "totalTasks",

    COUNT(t.id) FILTER (
      WHERE t.completed_at IS NULL
    )::int AS "openTasks",

    COUNT(t.id) FILTER (
      WHERE t.completed_at IS NOT NULL
    )::int AS "doneTasks",

    COUNT(t.id) FILTER (
      WHERE t.completed_at IS NULL
        AND t.due_at IS NOT NULL
        AND t.due_at < NOW()
    )::int AS "overdueTasks",

    MIN(t.due_at) FILTER (
      WHERE t.completed_at IS NULL
        AND t.due_at IS NOT NULL
    ) AS "deadline",

    CASE
      WHEN COUNT(t.id) = 0 THEN 0
      ELSE ROUND(
        (
          COUNT(t.id) FILTER (WHERE t.completed_at IS NOT NULL)::numeric
          / COUNT(t.id)::numeric
        ) * 100
      )::int
    END AS "progress"
  FROM projects p
  LEFT JOIN tasks t
    ON t.project_id = p.id
   AND t.workspace_id = p.workspace_id
   AND t.deleted_at IS NULL
  WHERE p.workspace_id = $1
    AND p.deleted_at IS NULL
  GROUP BY p.id
  ORDER BY p.updated_at DESC
  LIMIT 5
  `,
      [workspaceId],
    );

    const memberRaws = await db.query(
      `
      SELECT DISTINCT
        t.project_id AS "projectId",
        u.id AS "userId",
        u.username AS "username"
      FROM tasks t
      INNER JOIN task_assignees ta
        ON ta.task_id = t.id
      INNER JOIN users u
        ON u.id = ta.user_id
      WHERE t.workspace_id = $1
        AND t.deleted_at IS NULL
      `,
      [workspaceId],
    );

    const membersByProject = new Map<
      string,
      { userId: string; username: string | null }[]
    >();

    for (const member of memberRaws) {
      const list = membersByProject.get(member.projectId) ?? [];

      if (list.length < 3) {
        list.push({
          userId: member.userId,
          username: member.username,
        });
      }

      membersByProject.set(member.projectId, list);
    }

    const projects = projectRaws.map((project) => {
      let status: ProjectHealthStatus = 'ON_TRACK';

      if (Number(project.overdueTasks) > 0) {
        status = 'AT_RISK';
      } else if (
        project.deadline &&
        new Date(project.deadline).getTime() <=
          Date.now() + 3 * 24 * 60 * 60 * 1000
      ) {
        status = 'DUE_SOON';
      }

      return {
        id: project.id,
        name: project.name,
        code: project.code ?? null,

        openTasks: Number(project.openTasks),
        doneTasks: Number(project.doneTasks),
        totalTasks: Number(project.totalTasks),

        progress: Number(project.progress),

        deadline: project.deadline ?? null,
        status,

        members: membersByProject.get(project.id) ?? [],
      };
    });

    const attentions = await this.findAttentions(workspaceId, db);

    return {
      workspaceId,
      metrics: {
        projects: Number(metricsRaw.projects),
        openTasks: Number(metricsRaw.openTasks),
        overdueTasks: Number(metricsRaw.overdueTasks),
        members: Number(metricsRaw.members),
      },
      projects,
      attentions,
    };
  }

  private async findAttentions(
    workspaceId: string,
    db: EntityManager,
  ): Promise<WorkspaceAttentionItemDto[]> {
    const overdueRaws = await db.query(
      `
      SELECT
        p.id AS "projectId",
        p.name AS "projectName",
        COUNT(t.id)::int AS "count"
      FROM tasks t
      INNER JOIN projects p
        ON p.id = t.project_id
      WHERE t.workspace_id = $1
        AND t.deleted_at IS NULL
        AND t.completed_at IS NULL
        AND t.due_at IS NOT NULL
        AND t.due_at < NOW()
      GROUP BY p.id, p.name
      HAVING COUNT(t.id) > 0
      ORDER BY COUNT(t.id) DESC
      LIMIT 3
      `,
      [workspaceId],
    );

    const deadlineRaws = await db.query(
      `
      SELECT
        p.id AS "projectId",
        p.name AS "projectName",
        COUNT(t.id)::int AS "count"
      FROM tasks t
      INNER JOIN projects p
        ON p.id = t.project_id
      WHERE t.workspace_id = $1
        AND t.deleted_at IS NULL
        AND t.completed_at IS NULL
        AND t.due_at IS NOT NULL
        AND t.due_at >= NOW()
        AND t.due_at <= NOW() + INTERVAL '3 days'
      GROUP BY p.id, p.name
      HAVING COUNT(t.id) > 0
      ORDER BY COUNT(t.id) DESC
      LIMIT 3
      `,
      [workspaceId],
    );

    const unassignedRaws = await db.query(
      `
      SELECT
        p.id AS "projectId",
        p.name AS "projectName",
        COUNT(t.id)::int AS "count"
      FROM tasks t
      INNER JOIN projects p
        ON p.id = t.project_id
      WHERE t.workspace_id = $1
        AND t.deleted_at IS NULL
        AND t.completed_at IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM task_assignees ta
          WHERE ta.task_id = t.id
        )
      GROUP BY p.id, p.name
      HAVING COUNT(t.id) > 0
      ORDER BY COUNT(t.id) DESC
      LIMIT 3
      `,
      [workspaceId],
    );

    return [
      ...overdueRaws.map((item) => ({
        type: 'OVERDUE' as const,
        projectId: item.projectId,
        projectName: item.projectName,
        count: Number(item.count),
        message: `${item.count} task quá hạn trong ${item.projectName}`,
      })),

      ...deadlineRaws.map((item) => ({
        type: 'DEADLINE_SOON' as const,
        projectId: item.projectId,
        projectName: item.projectName,
        count: Number(item.count),
        message: `${item.count} task sắp tới deadline trong 3 ngày`,
      })),

      ...unassignedRaws.map((item) => ({
        type: 'UNASSIGNED' as const,
        projectId: item.projectId,
        projectName: item.projectName,
        count: Number(item.count),
        message: `${item.count} task chưa assign người phụ trách`,
      })),
    ].slice(0, 5);
  }
}
