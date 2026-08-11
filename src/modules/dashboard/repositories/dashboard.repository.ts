import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from 'src/modules/activity/domain/entities/activity.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { Repository } from 'typeorm';
import {
  DashboardActivityRow,
  DashboardDateRange,
  DashboardRepository,
  DashboardTaskRow,
  DashboardTaskStatsRow,
  DashboardWorkspaceRow,
} from '../interfaces/repositories/dashboard.repository.interface';

type RawTaskStats = Record<keyof DashboardTaskStatsRow, string | number | null>;

type RawTaskRow = Omit<
  DashboardTaskRow,
  'priorityLevel' | 'statusIsDone' | 'estimateMinutes'
> & {
  priorityLevel: string | number | null;
  statusIsDone: boolean | string;
  estimateMinutes: string | number | null;
};

type RawWorkspaceRow = Omit<
  DashboardWorkspaceRow,
  'projectCount' | 'openTaskCount' | 'completedTaskCount'
> & {
  projectCount: string | number;
  openTaskCount: string | number;
  completedTaskCount: string | number;
};

@Injectable()
export class DashboardRepositoryImpl implements DashboardRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,

    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async getTaskStats(
    userId: string,
    range: DashboardDateRange,
  ): Promise<DashboardTaskStatsRow> {
    const row = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.assignees', 'assignee', 'assignee.user_id = :userId', {
        userId,
      })
      .innerJoin('task.status', 'status')
      .innerJoin('task.workspace', 'workspace')
      .innerJoin('task.project', 'project')
      .where('task.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .andWhere('project.deleted_at IS NULL')
      .select([
        `COUNT(*) FILTER (
          WHERE status.is_done = false
          AND task.completed_at IS NULL
        )::int AS "myTasks"`,
        `COUNT(*) FILTER (
          WHERE status.is_done = false
          AND task.completed_at IS NULL
          AND task.due_at >= :dayStart
          AND task.due_at < :dayEnd
        )::int AS "todayTasks"`,
        `COUNT(*) FILTER (
          WHERE status.is_done = false
          AND task.completed_at IS NULL
          AND task.due_at >= :dayStart
          AND task.due_at < :upcomingEnd
        )::int AS "upcoming"`,
        `COUNT(*) FILTER (
          WHERE status.is_done = false
          AND task.completed_at IS NULL
          AND task.due_at IS NOT NULL
          AND task.due_at < :now
        )::int AS "overdue"`,
        `COUNT(*) FILTER (
          WHERE (
            (task.completed_at >= :dayStart AND task.completed_at < :dayEnd)
            OR (
              task.completed_at IS NULL
              AND status.is_done = true
              AND task.updated_at >= :dayStart
              AND task.updated_at < :dayEnd
            )
          )
        )::int AS "completedToday"`,
        `COUNT(*) FILTER (
          WHERE (
            (task.completed_at >= :weekStart AND task.completed_at < :weekEnd)
            OR (
              task.completed_at IS NULL
              AND status.is_done = true
              AND task.updated_at >= :weekStart
              AND task.updated_at < :weekEnd
            )
          )
        )::int AS "completedThisWeek"`,
        `COUNT(*) FILTER (
          WHERE status.is_done = false
          AND task.completed_at IS NULL
          AND task.due_at >= :now
          AND task.due_at < :weekEnd
        )::int AS "remainingThisWeek"`,
        `COUNT(*) FILTER (
          WHERE status.is_done = false
          AND task.completed_at IS NULL
          AND LOWER(status.name) LIKE '%review%'
        )::int AS "reviewTaskCount"`,
        `COALESCE(SUM(task.estimate_minutes) FILTER (
          WHERE status.is_done = false
          AND task.completed_at IS NULL
          AND task.due_at >= :dayStart
          AND task.due_at < :dayEnd
        ), 0)::int AS "deepWorkMinutes"`,
      ])
      .setParameters(range)
      .getRawOne<RawTaskStats>();

    return {
      myTasks: this.toNumber(row?.myTasks),
      todayTasks: this.toNumber(row?.todayTasks),
      upcoming: this.toNumber(row?.upcoming),
      overdue: this.toNumber(row?.overdue),
      completedToday: this.toNumber(row?.completedToday),
      completedThisWeek: this.toNumber(row?.completedThisWeek),
      remainingThisWeek: this.toNumber(row?.remainingThisWeek),
      reviewTaskCount: this.toNumber(row?.reviewTaskCount),
      deepWorkMinutes: this.toNumber(row?.deepWorkMinutes),
    };
  }

  async findPriorityTasks(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardTaskRow[]> {
    const rows = await this.baseAssignedOpenTaskQuery(userId)
      .andWhere(
        `(task.due_at IS NULL OR task.due_at < :upcomingEnd OR priority.level IS NOT NULL)`,
        { upcomingEnd: range.upcomingEnd },
      )
      .orderBy(
        `CASE
          WHEN task.due_at IS NOT NULL AND task.due_at < :now THEN 0
          WHEN task.due_at IS NOT NULL THEN 1
          ELSE 2
        END`,
        'ASC',
      )
      .addOrderBy('priority.level', 'DESC', 'NULLS LAST')
      .addOrderBy('task.due_at', 'ASC', 'NULLS LAST')
      .setParameter('now', range.now)
      .limit(limit)
      .getRawMany<RawTaskRow>();

    return rows.map((row) => this.mapTaskRow(row));
  }

  async findRecentDeadlines(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardTaskRow[]> {
    const rows = await this.baseAssignedOpenTaskQuery(userId)
      .andWhere('task.due_at IS NOT NULL')
      .orderBy(`CASE WHEN task.due_at < :now THEN 0 ELSE 1 END`, 'ASC')
      .addOrderBy('task.due_at', 'ASC')
      .setParameter('now', range.now)
      .limit(limit)
      .getRawMany<RawTaskRow>();

    return rows.map((row) => this.mapTaskRow(row));
  }

  async findRecentWorkspaces(
    userId: string,
    limit: number,
  ): Promise<DashboardWorkspaceRow[]> {
    const rows = await this.userWorkspaceRepository
      .createQueryBuilder('uw')
      .innerJoin('uw.workspace', 'workspace')
      .where('uw.user_id = :userId', { userId })
      .andWhere('workspace.deleted_at IS NULL')
      .select([
        'workspace.id AS "id"',
        'workspace.name AS "name"',
        'workspace.slug AS "slug"',
        'uw.last_opened_at AS "lastOpenedAt"',
      ])
      .addSelect(
        `(SELECT COUNT(*)
          FROM projects project
          WHERE project.workspace_id = workspace.id
          AND project.deleted_at IS NULL)`,
        'projectCount',
      )
      .addSelect(
        `(SELECT COUNT(DISTINCT task.id)
          FROM tasks task
          INNER JOIN task_assignees assignee
            ON assignee.task_id = task.id
            AND assignee.user_id = :userId
          INNER JOIN task_statuses status
            ON status.id = task.status_id
            AND status.is_done = false
          WHERE task.workspace_id = workspace.id
          AND task.completed_at IS NULL
          AND task.deleted_at IS NULL)`,
        'openTaskCount',
      )
      .addSelect(
        `(SELECT COUNT(DISTINCT task.id)
          FROM tasks task
          INNER JOIN task_assignees assignee
            ON assignee.task_id = task.id
            AND assignee.user_id = :userId
          INNER JOIN task_statuses status
            ON status.id = task.status_id
          WHERE task.workspace_id = workspace.id
          AND (status.is_done = true OR task.completed_at IS NOT NULL)
          AND task.deleted_at IS NULL)`,
        'completedTaskCount',
      )
      .orderBy('uw.last_opened_at', 'DESC', 'NULLS LAST')
      .addOrderBy('workspace.updated_at', 'DESC')
      .limit(limit)
      .getRawMany<RawWorkspaceRow>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      projectCount: this.toNumber(row.projectCount),
      openTaskCount: this.toNumber(row.openTaskCount),
      completedTaskCount: this.toNumber(row.completedTaskCount),
      lastOpenedAt: row.lastOpenedAt,
    }));
  }

  async findRecentActivities(
    userId: string,
    limit: number,
  ): Promise<DashboardActivityRow[]> {
    return this.activityRepository
      .createQueryBuilder('activity')
      .innerJoin(
        'user_workspaces',
        'uw',
        'uw.workspace_id = activity.workspace_id AND uw.user_id = :userId',
        { userId },
      )
      .select([
        'activity.id AS "id"',
        'activity.workspace_id AS "workspaceId"',
        'activity.project_id AS "projectId"',
        'activity.action AS "action"',
        'activity.field AS "field"',
        'activity.metadata AS "metadata"',
        'activity.new_value AS "newValue"',
        'activity.created_at AS "createdAt"',
      ])
      .orderBy('activity.created_at', 'DESC')
      .limit(limit)
      .getRawMany<DashboardActivityRow>();
  }

  async countUnassignedTasks(userId: string): Promise<number> {
    const count = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin(
        'user_workspaces',
        'uw',
        'uw.workspace_id = task.workspace_id AND uw.user_id = :userId',
        { userId },
      )
      .innerJoin('task.status', 'status')
      .innerJoin('task.workspace', 'workspace')
      .innerJoin('task.project', 'project')
      .leftJoin('task.assignees', 'assignee')
      .where('task.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere('status.is_done = false')
      .andWhere('task.completed_at IS NULL')
      .andWhere('assignee.id IS NULL')
      .getCount();

    return count;
  }

  private baseAssignedOpenTaskQuery(userId: string) {
    return this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.assignees', 'assignee', 'assignee.user_id = :userId', {
        userId,
      })
      .innerJoin('task.status', 'status')
      .innerJoin('task.workspace', 'workspace')
      .innerJoin('task.project', 'project')
      .leftJoin('task.priority', 'priority')
      .where('task.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere('status.is_done = false')
      .andWhere('task.completed_at IS NULL')
      .select([
        'task.id AS "id"',
        'task.workspace_id AS "workspaceId"',
        'task.project_id AS "projectId"',
        'task.title AS "title"',
        'task.due_at AS "dueAt"',
        'task.start_at AS "startAt"',
        'task.completed_at AS "completedAt"',
        'task.estimate_minutes AS "estimateMinutes"',
        'workspace.name AS "workspaceName"',
        'project.name AS "projectName"',
        'priority.name AS "priorityName"',
        'priority.level AS "priorityLevel"',
        'status.name AS "statusName"',
        'status.is_done AS "statusIsDone"',
      ]);
  }

  private baseAssignedDoneTaskQuery(userId: string) {
    return this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.assignees', 'assignee', 'assignee.user_id = :userId', {
        userId,
      })
      .innerJoin('task.status', 'status')
      .innerJoin('task.workspace', 'workspace')
      .innerJoin('task.project', 'project')
      .leftJoin('task.priority', 'priority')
      .where('task.deleted_at IS NULL')
      .andWhere('workspace.deleted_at IS NULL')
      .andWhere('project.deleted_at IS NULL')
      .andWhere('(status.is_done = true OR task.completed_at IS NOT NULL)')
      .select([
        'task.id AS "id"',
        'task.workspace_id AS "workspaceId"',
        'task.project_id AS "projectId"',
        'task.title AS "title"',
        'task.due_at AS "dueAt"',
        'task.start_at AS "startAt"',
        'task.completed_at AS "completedAt"',
        'task.estimate_minutes AS "estimateMinutes"',
        'workspace.name AS "workspaceName"',
        'project.name AS "projectName"',
        'priority.name AS "priorityName"',
        'priority.level AS "priorityLevel"',
        'status.name AS "statusName"',
        'status.is_done AS "statusIsDone"',
      ]);
  }

  async findRecentCompletedTasks(
    userId: string,
    limit: number,
  ): Promise<DashboardTaskRow[]> {
    const rows = await this.baseAssignedDoneTaskQuery(userId)
      .orderBy('COALESCE(task.completed_at, task.updated_at)', 'DESC')
      .limit(limit)
      .getRawMany<RawTaskRow>();

    return rows.map((row) => this.mapTaskRow(row));
  }

  private mapTaskRow(row: RawTaskRow): DashboardTaskRow {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      projectId: row.projectId,
      title: row.title,
      workspaceName: row.workspaceName,
      projectName: row.projectName,
      priorityName: row.priorityName,
      priorityLevel:
        row.priorityLevel === null ? null : this.toNumber(row.priorityLevel),
      statusName: row.statusName,
      statusIsDone: row.statusIsDone === true || row.statusIsDone === 'true',
      dueAt: row.dueAt,
      startAt: row.startAt,
      completedAt: row.completedAt,
      estimateMinutes:
        row.estimateMinutes === null
          ? null
          : this.toNumber(row.estimateMinutes),
    };
  }

  private toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return Number(value);
  }
}
