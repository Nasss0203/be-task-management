import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  GetWorkspaceOverviewResponseDto,
  WorkspaceOverviewAttentionType,
  WorkspaceOverviewDeadlineType,
  WorkspaceOverviewProjectHealth,
} from '../dto/response/get-workspace-overview.response.dto';
import { WorkspaceOverviewRepository } from '../interfaces/repositories/workspace-overview.repository.interface';

type CountValue = string | number | null | undefined;

type WorkspaceRow = {
  id: string;
};

type MetricCountsRow = {
  projectCount: CountValue;
  newProjectCount: CountValue;
  openTaskCount: CountValue;
  myOpenTaskCount: CountValue;
  overdueTaskCount: CountValue;
  myOverdueTaskCount: CountValue;
  memberCount: CountValue;
  activeMemberCount: CountValue;
};

type ProjectRow = {
  id: string;
  name: string;
  code: string;
  totalTasks: CountValue;
  openTasks: CountValue;
  doneTasks: CountValue;
  overdueTasks: CountValue;
  progress: CountValue;
  deadline: Date | string | null;
};

type ProjectMemberRow = {
  projectId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
};

type TaskStatusRow = {
  statusId: string;
  name: string;
  count: CountValue;
  isDone: boolean | string;
  color: string | null;
  position: CountValue;
};

type AttentionRow = {
  projectId: string | null;
  projectName: string | null;
  count: CountValue;
};

type MyTaskRow = {
  id: string;
  title: string;
  dueAt: Date | string | null;
  projectId: string;
  projectName: string;
  statusId: string;
  statusName: string;
  statusIsDone: boolean | string;
  statusColor: string | null;
  priorityId: string | null;
  priorityName: string | null;
  priorityLevel: CountValue;
  priorityColor: string | null;
};

type ActivityRow = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorUsername: string | null;
  actorAvatar: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  targetName: string | null;
  field: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
};

type DeadlineRow = {
  id: string;
  title: string;
  type: WorkspaceOverviewDeadlineType;
  deadline: Date | string;
  projectId: string;
};

@Injectable()
export class WorkspaceOverviewRepositoryImpl implements WorkspaceOverviewRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(
    workspaceId: string,
    userId: string,
  ): Promise<GetWorkspaceOverviewResponseDto> {
    const workspace = await this.findWorkspace(workspaceId);

    const [
      metricCounts,
      projects,
      projectMembers,
      taskStatusRows,
      overdueRows,
      deadlineSoonRows,
      unassignedRows,
      myTaskRows,
      activityRows,
      deadlineRows,
    ] = await Promise.all([
      this.getMetricCounts(workspace.id, userId),
      this.findProjects(workspace.id),
      this.findProjectMembers(workspace.id),
      this.findTaskStatusRows(workspace.id),
      this.findOverdueAttentions(workspace.id),
      this.findDeadlineSoonAttentions(workspace.id),
      this.findUnassignedAttentions(workspace.id),
      this.findMyTasks(workspace.id, userId),
      this.findActivities(workspace.id),
      this.findUpcomingDeadlines(workspace.id),
    ]);

    const taskStatusItems = taskStatusRows.map((row) => ({
      statusId: row.statusId,
      name: row.name,
      count: this.toNumber(row.count),
      isDone: this.toBoolean(row.isDone),
      color: row.color,
      position:
        row.position === null || row.position === undefined
          ? null
          : this.toNumber(row.position),
    }));

    return {
      metrics: {
        projects: {
          count: this.toNumber(metricCounts.projectCount),
          newThisWeek: this.toNumber(metricCounts.newProjectCount),
        },
        openTasks: {
          count: this.toNumber(metricCounts.openTaskCount),
          assignedToMe: this.toNumber(metricCounts.myOpenTaskCount),
        },
        overdueTasks: {
          count: this.toNumber(metricCounts.overdueTaskCount),
          assignedToMe: this.toNumber(metricCounts.myOverdueTaskCount),
        },
        members: {
          count: this.toNumber(metricCounts.memberCount),
          activeRecently: this.toNumber(metricCounts.activeMemberCount),
        },
      },
      projects: this.mapProjects(projects, projectMembers),
      taskStatus: {
        total: taskStatusItems.reduce((sum, item) => sum + item.count, 0),
        items: taskStatusItems,
      },
      attentionItems: [
        ...this.mapAttentionRows(overdueRows, 'overdue'),
        ...this.mapAttentionRows(deadlineSoonRows, 'deadline-soon'),
        ...this.mapAttentionRows(unassignedRows, 'unassigned'),
      ].slice(0, 5),
      myTasks: myTaskRows.map((row) => ({
        id: row.id,
        title: row.title,
        dueAt: row.dueAt ? this.toDate(row.dueAt).toISOString() : null,
        daysRemaining: row.dueAt ? this.getDaysRemaining(row.dueAt) : null,
        isOverdue: this.isOverdue(row.dueAt),
        project: {
          id: row.projectId,
          name: row.projectName,
        },
        status: {
          id: row.statusId,
          name: row.statusName,
          isDone: this.toBoolean(row.statusIsDone),
          color: row.statusColor,
        },
        priority: row.priorityId
          ? {
              id: row.priorityId,
              name: row.priorityName!,
              level:
                row.priorityLevel === null || row.priorityLevel === undefined
                  ? null
                  : this.toNumber(row.priorityLevel),
              color: row.priorityColor,
            }
          : null,
      })),
      activities: activityRows.map((row) => ({
        id: row.id,
        actor: {
          id: row.actorId,
          name: row.actorName ?? row.actorUsername ?? 'System',
          avatarUrl: row.actorAvatar,
        },
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        targetName: row.targetName,
        field: row.field,
        metadata: row.metadata,
        createdAt: this.toDate(row.createdAt).toISOString(),
      })),
      upcomingDeadlines: deadlineRows.map((row) => {
        const daysRemaining = this.getDaysRemaining(row.deadline);

        return {
          id: row.id,
          title: row.title,
          type: row.type,
          deadline: this.toDate(row.deadline).toISOString(),
          daysRemaining,
          isUrgent: daysRemaining <= 3,
          projectId: row.projectId,
        };
      }),
    };
  }

  private async findWorkspace(workspaceId: string): Promise<WorkspaceRow> {
    const rows = await this.dataSource.query<WorkspaceRow[]>(
      `
        SELECT id
        FROM workspaces
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [workspaceId],
    );

    const workspace = rows?.[0];

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  private async getMetricCounts(
    workspaceId: string,
    userId: string,
  ): Promise<MetricCountsRow> {
    const rows = await this.dataSource.query<MetricCountsRow[]>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM projects p
            WHERE p.workspace_id = $1
              AND p.deleted_at IS NULL
          ) AS "projectCount",
          (
            SELECT COUNT(*)::int
            FROM projects p
            WHERE p.workspace_id = $1
              AND p.deleted_at IS NULL
              AND p.created_at >= NOW() - INTERVAL '7 days'
          ) AS "newProjectCount",
          (
            SELECT COUNT(*)::int
            FROM tasks t
            INNER JOIN task_statuses s
              ON s.id = t.status_id
              AND s.workspace_id = t.workspace_id
            WHERE t.workspace_id = $1
              AND t.deleted_at IS NULL
              AND s.is_done = false
          ) AS "openTaskCount",
          (
            SELECT COUNT(DISTINCT t.id)::int
            FROM tasks t
            INNER JOIN task_statuses s
              ON s.id = t.status_id
              AND s.workspace_id = t.workspace_id
            INNER JOIN task_assignees ta
              ON ta.task_id = t.id
              AND ta.user_id = $2
            WHERE t.workspace_id = $1
              AND t.deleted_at IS NULL
              AND s.is_done = false
          ) AS "myOpenTaskCount",
          (
            SELECT COUNT(*)::int
            FROM tasks t
            INNER JOIN task_statuses s
              ON s.id = t.status_id
              AND s.workspace_id = t.workspace_id
            WHERE t.workspace_id = $1
              AND t.deleted_at IS NULL
              AND s.is_done = false
              AND t.due_at IS NOT NULL
              AND t.due_at < NOW()
          ) AS "overdueTaskCount",
          (
            SELECT COUNT(DISTINCT t.id)::int
            FROM tasks t
            INNER JOIN task_statuses s
              ON s.id = t.status_id
              AND s.workspace_id = t.workspace_id
            INNER JOIN task_assignees ta
              ON ta.task_id = t.id
              AND ta.user_id = $2
            WHERE t.workspace_id = $1
              AND t.deleted_at IS NULL
              AND s.is_done = false
              AND t.due_at IS NOT NULL
              AND t.due_at < NOW()
          ) AS "myOverdueTaskCount",
          (
            SELECT COUNT(*)::int
            FROM user_workspaces uw
            INNER JOIN users u ON u.id = uw.user_id
            WHERE uw.workspace_id = $1
              AND u.deleted_at IS NULL
          ) AS "memberCount",
          (
            SELECT COUNT(*)::int
            FROM user_workspaces uw
            INNER JOIN users u ON u.id = uw.user_id
            WHERE uw.workspace_id = $1
              AND u.deleted_at IS NULL
              AND uw.last_opened_at >= NOW() - INTERVAL '7 days'
          ) AS "activeMemberCount"
      `,
      [workspaceId, userId],
    );

    return rows[0];
  }

  private findProjects(workspaceId: string): Promise<ProjectRow[]> {
    return this.dataSource.query<ProjectRow[]>(
      `
        SELECT
          p.id AS "id",
          p.name AS "name",
          p.key AS "code",
          COUNT(t.id)::int AS "totalTasks",
          COUNT(t.id) FILTER (WHERE s.is_done = false)::int AS "openTasks",
          COUNT(t.id) FILTER (WHERE s.is_done = true)::int AS "doneTasks",
          COUNT(t.id) FILTER (
            WHERE s.is_done = false
              AND t.due_at IS NOT NULL
              AND t.due_at < NOW()
          )::int AS "overdueTasks",
          CASE
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE ROUND(
              (
                COUNT(t.id) FILTER (WHERE s.is_done = true)::numeric
                / COUNT(t.id)::numeric
              ) * 100
            )::int
          END AS "progress",
          MIN(t.due_at) FILTER (
            WHERE s.is_done = false
              AND t.due_at IS NOT NULL
          ) AS "deadline"
        FROM projects p
        LEFT JOIN tasks t
          ON t.project_id = p.id
          AND t.workspace_id = p.workspace_id
          AND t.deleted_at IS NULL
        LEFT JOIN task_statuses s
          ON s.id = t.status_id
          AND s.workspace_id = t.workspace_id
        WHERE p.workspace_id = $1
          AND p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY p.updated_at DESC
        LIMIT 5
      `,
      [workspaceId],
    );
  }

  private findProjectMembers(workspaceId: string): Promise<ProjectMemberRow[]> {
    return this.dataSource.query<ProjectMemberRow[]>(
      `
        SELECT DISTINCT ON (t.project_id, u.id)
          t.project_id AS "projectId",
          u.id AS "userId",
          COALESCE(up.display_name, up.full_name, u.username) AS "name",
          u.avatar_url AS "avatarUrl"
        FROM tasks t
        INNER JOIN task_assignees ta ON ta.task_id = t.id
        INNER JOIN users u ON u.id = ta.user_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE t.workspace_id = $1
          AND t.deleted_at IS NULL
          AND u.deleted_at IS NULL
        ORDER BY t.project_id, u.id, ta.assigned_at DESC
      `,
      [workspaceId],
    );
  }

  private findTaskStatusRows(workspaceId: string): Promise<TaskStatusRow[]> {
    return this.dataSource.query<TaskStatusRow[]>(
      `
        SELECT
          s.id AS "statusId",
          s.name AS "name",
          s.is_done AS "isDone",
          s.color AS "color",
          s.position AS "position",
          COUNT(t.id)::int AS "count"
        FROM task_statuses s
        LEFT JOIN tasks t
          ON t.status_id = s.id
          AND t.workspace_id = s.workspace_id
          AND t.deleted_at IS NULL
        WHERE s.workspace_id = $1
        GROUP BY s.id
        ORDER BY s.position ASC, s.created_at ASC
      `,
      [workspaceId],
    );
  }

  private findOverdueAttentions(workspaceId: string): Promise<AttentionRow[]> {
    return this.dataSource.query<AttentionRow[]>(
      `
        SELECT
          p.id AS "projectId",
          p.name AS "projectName",
          COUNT(t.id)::int AS "count"
        FROM tasks t
        INNER JOIN task_statuses s
          ON s.id = t.status_id
          AND s.workspace_id = t.workspace_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE t.workspace_id = $1
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND s.is_done = false
          AND t.due_at IS NOT NULL
          AND t.due_at < NOW()
        GROUP BY p.id, p.name
        ORDER BY COUNT(t.id) DESC
        LIMIT 3
      `,
      [workspaceId],
    );
  }

  private findDeadlineSoonAttentions(
    workspaceId: string,
  ): Promise<AttentionRow[]> {
    return this.dataSource.query<AttentionRow[]>(
      `
        SELECT
          p.id AS "projectId",
          p.name AS "projectName",
          COUNT(t.id)::int AS "count"
        FROM tasks t
        INNER JOIN task_statuses s
          ON s.id = t.status_id
          AND s.workspace_id = t.workspace_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE t.workspace_id = $1
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND s.is_done = false
          AND t.due_at IS NOT NULL
          AND t.due_at >= NOW()
          AND t.due_at <= NOW() + INTERVAL '3 days'
        GROUP BY p.id, p.name
        ORDER BY COUNT(t.id) DESC
        LIMIT 3
      `,
      [workspaceId],
    );
  }

  private findUnassignedAttentions(
    workspaceId: string,
  ): Promise<AttentionRow[]> {
    return this.dataSource.query<AttentionRow[]>(
      `
        SELECT
          p.id AS "projectId",
          p.name AS "projectName",
          COUNT(t.id)::int AS "count"
        FROM tasks t
        INNER JOIN task_statuses s
          ON s.id = t.status_id
          AND s.workspace_id = t.workspace_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE t.workspace_id = $1
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND s.is_done = false
          AND NOT EXISTS (
            SELECT 1
            FROM task_assignees ta
            WHERE ta.task_id = t.id
          )
        GROUP BY p.id, p.name
        ORDER BY COUNT(t.id) DESC
        LIMIT 3
      `,
      [workspaceId],
    );
  }

  private findMyTasks(
    workspaceId: string,
    userId: string,
  ): Promise<MyTaskRow[]> {
    return this.dataSource.query<MyTaskRow[]>(
      `
        SELECT
          t.id AS "id",
          t.title AS "title",
          t.due_at AS "dueAt",
          p.id AS "projectId",
          p.name AS "projectName",
          status.id AS "statusId",
          status.name AS "statusName",
          status.is_done AS "statusIsDone",
          status.color AS "statusColor",
          priority.id AS "priorityId",
          priority.name AS "priorityName",
          priority.level AS "priorityLevel",
          priority.color AS "priorityColor"
        FROM tasks t
        INNER JOIN task_assignees ta
          ON ta.task_id = t.id
          AND ta.user_id = $2
        INNER JOIN task_statuses status
          ON status.id = t.status_id
          AND status.workspace_id = t.workspace_id
        LEFT JOIN task_priorities priority
          ON priority.id = t.priority_id
          AND priority.workspace_id = t.workspace_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE t.workspace_id = $1
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND status.is_done = false
        ORDER BY
          CASE
            WHEN t.due_at IS NOT NULL AND t.due_at < NOW() THEN 0
            WHEN t.due_at IS NOT NULL THEN 1
            ELSE 2
          END ASC,
          t.due_at ASC NULLS LAST,
          priority.level DESC NULLS LAST,
          t.updated_at DESC
        LIMIT 5
      `,
      [workspaceId, userId],
    );
  }

  private findActivities(workspaceId: string): Promise<ActivityRow[]> {
    return this.dataSource.query<ActivityRow[]>(
      `
        SELECT
          a.id AS "id",
          a.actor_id AS "actorId",
          COALESCE(up.display_name, up.full_name) AS "actorName",
          u.username AS "actorUsername",
          u.avatar_url AS "actorAvatar",
          a.action AS "action",
          a.entity_type AS "entityType",
          a.entity_id AS "entityId",
          COALESCE(
            t.title,
            p.name,
            sp.name,
            pg.title,
            a.metadata->>'title',
            a.metadata->>'name'
          ) AS "targetName",
          a.field AS "field",
          a.metadata AS "metadata",
          a.created_at AS "createdAt"
        FROM activities a
        LEFT JOIN users u ON u.id = a.actor_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN tasks t
          ON a.entity_type = 'TASK'
          AND t.id = a.entity_id
          AND t.deleted_at IS NULL
        LEFT JOIN projects p
          ON a.entity_type = 'PROJECT'
          AND p.id = a.entity_id
          AND p.deleted_at IS NULL
        LEFT JOIN sprints sp
          ON a.entity_type = 'SPRINT'
          AND sp.id = a.entity_id
          AND sp.deleted_at IS NULL
        LEFT JOIN pages pg
          ON a.entity_type = 'PAGE'
          AND pg.id = a.entity_id
          AND pg.deleted_at IS NULL
        WHERE a.workspace_id = $1
        ORDER BY a.created_at DESC
        LIMIT 8
      `,
      [workspaceId],
    );
  }

	private findUpcomingDeadlines(workspaceId: string): Promise<DeadlineRow[]> {
		return this.dataSource.query<DeadlineRow[]>(
			`
        SELECT
          t.id AS "id",
          t.title AS "title",
          'task' AS "type",
          t.due_at AS "deadline",
          p.id AS "projectId"
        FROM tasks t
        INNER JOIN task_statuses s
          ON s.id = t.status_id
          AND s.workspace_id = t.workspace_id
        INNER JOIN projects p ON p.id = t.project_id
        WHERE t.workspace_id = $1
          AND t.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND s.is_done = false
          AND t.due_at IS NOT NULL
          AND t.due_at >= NOW()
          AND t.due_at <= NOW() + INTERVAL '7 days'

        UNION ALL

        SELECT
          sp.id AS "id",
          sp.name AS "title",
          'sprint' AS "type",
          sp.end_at AS "deadline",
          p.id AS "projectId"
        FROM sprints sp
        INNER JOIN projects p ON p.id = sp.project_id
        WHERE sp.workspace_id = $1
          AND sp.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND sp.status <> 'COMPLETED'
          AND sp.end_at IS NOT NULL
          AND sp.end_at >= NOW()
          AND sp.end_at <= NOW() + INTERVAL '7 days'

        ORDER BY "deadline" ASC
        LIMIT 5
      `,
      [workspaceId],
    );
  }

  private mapProjects(projects: ProjectRow[], members: ProjectMemberRow[]) {
    const membersByProject = new Map<
      string,
      Array<{ id: string; name: string; avatarUrl: string | null }>
    >();

    for (const member of members) {
      const list = membersByProject.get(member.projectId) ?? [];

      if (list.length < 3) {
        list.push({
          id: member.userId,
          name: member.name,
          avatarUrl: member.avatarUrl,
        });
      }

      membersByProject.set(member.projectId, list);
    }

    return projects.map((project) => {
      const totalTasks = this.toNumber(project.totalTasks);
      const progress = this.toNumber(project.progress);
      const overdueTasks = this.toNumber(project.overdueTasks);

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        health: this.getProjectHealth({
          totalTasks,
          progress,
          overdueTasks,
        }),
        progress,
        totalTasks,
        openTasks: this.toNumber(project.openTasks),
        doneTasks: this.toNumber(project.doneTasks),
        overdueTasks,
        deadline: project.deadline
          ? this.toDate(project.deadline).toISOString()
          : null,
        members: membersByProject.get(project.id) ?? [],
      };
    });
  }

  private mapAttentionRows(
    rows: AttentionRow[],
    type: WorkspaceOverviewAttentionType,
  ) {
    return rows.map((row) => ({
      id: `${type}-${row.projectId ?? 'workspace'}`,
      type,
      count: this.toNumber(row.count),
      projectId: row.projectId,
      projectName: row.projectName,
    }));
  }

  private getProjectHealth(input: {
    totalTasks: number;
    progress: number;
    overdueTasks: number;
  }): WorkspaceOverviewProjectHealth {
    if (input.overdueTasks > 0) {
      return 'at-risk';
    }

    if (input.totalTasks > 0 && input.progress >= 80) {
      return 'almost-done';
    }

    return 'on-track';
  }

  private isOverdue(value: Date | string | null): boolean {
    return Boolean(value && this.toDate(value).getTime() < Date.now());
  }

  private getDaysRemaining(value: Date | string): number {
    const deadline = this.toDate(value);
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const deadlineStart = new Date(
      deadline.getFullYear(),
      deadline.getMonth(),
      deadline.getDate(),
    );

    return Math.ceil(
      (deadlineStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
    );
  }

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private toNumber(value: CountValue): number {
    if (value === null || value === undefined) return 0;

    return Number(value);
  }

  private toBoolean(value: boolean | string): boolean {
    return value === true || value === 'true';
  }
}
