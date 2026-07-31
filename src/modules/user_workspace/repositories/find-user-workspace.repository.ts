import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserWorkspace } from '../domain/entities/user_workspace.entity';
import { MemberWorkspaceModel } from '../domain/models/user_workspace.model';
import { FindUserWorkspaceRepository } from '../interfaces/repositories/find-user-workspace.repository.interface';
import {
  MemberWorkspaceMapper,
  MemberWorkspaceRaw,
} from '../mapper/member-workspace.mapper';

@Injectable()
export class FindUserWorkspaceRepositoryImpl implements FindUserWorkspaceRepository {
  constructor(
    @InjectRepository(UserWorkspace)
    private readonly repoUserworkspace: Repository<UserWorkspace>,

    private readonly dataSource: DataSource,
  ) {}

  private getRepo(manager?: EntityManager): Repository<UserWorkspace> {
    return manager
      ? manager.getRepository(UserWorkspace)
      : this.repoUserworkspace;
  }

  async findMemberInWorkspace(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel | null> {
    const repo = manager
      ? manager.getRepository(UserWorkspace)
      : this.dataSource.getRepository(UserWorkspace);

    const raw = await repo
      .createQueryBuilder('uw')
      .innerJoin('users', 'u', 'u.id = uw.user_id')
      .innerJoin(
        'user_roles',
        'ur',
        'ur.user_id = uw.user_id AND ur.workspace_id = uw.workspace_id',
      )
      .innerJoin('roles', 'r', 'r.id = ur.role_id')
      .select([
        'uw.id as id',
        'uw.workspace_id as workspace_id',
        'uw.user_id as user_id',
        'u.username as full_name',
        'u.email as email',
        'NULL::text as avatar_url',
        'r.name as role_name',
        'uw.last_opened_at as "lastOpenedAt"',
        'uw.joined_at as "joinedAt"',
      ])
      .addSelect((qb) => {
        return qb
          .select('COUNT(ta.task_id)')
          .from('task_assignees', 'ta')
          .innerJoin('tasks', 't', 't.id = ta.task_id')
          .where('ta.user_id = uw.user_id')
          .andWhere('t.workspace_id = :workspaceId', { workspaceId });
      }, 'taskCount')
      .where('uw.workspace_id = :workspaceId', { workspaceId })
      .andWhere('uw.user_id = :userId', { userId })
      .getRawOne<MemberWorkspaceRaw>();

    if (!raw) return null;

    return MemberWorkspaceMapper.toModel(raw);
  }

  async findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel[]> {
    const executor = manager ?? this.dataSource.manager;
    const raws = await executor.query<MemberWorkspaceRaw[]>(
      `
        SELECT
          uw.id AS id,
          uw.workspace_id AS workspace_id,
          uw.user_id AS user_id,
          u.username AS full_name,
          u.email AS email,
          NULL::text AS avatar_url,
          r.name AS role_name,
          uw.last_opened_at AS "lastOpenedAt",
          uw.joined_at AS "joinedAt",
          COUNT(t.id)::int AS "taskCount"
        FROM user_workspaces uw
        INNER JOIN users u
          ON u.id = uw.user_id
        INNER JOIN user_roles ur
          ON ur.user_id = uw.user_id
          AND ur.workspace_id = uw.workspace_id
        INNER JOIN roles r
          ON r.id = ur.role_id
        LEFT JOIN task_assignees ta
          ON ta.user_id = uw.user_id
        LEFT JOIN tasks t
          ON t.id = ta.task_id
          AND t.workspace_id = uw.workspace_id
          AND t.deleted_at IS NULL
        WHERE uw.workspace_id = $1
        GROUP BY
          uw.id,
          uw.workspace_id,
          uw.user_id,
          u.username,
          u.email,
          r.name,
          uw.last_opened_at,
          uw.joined_at
      `,
      [workspaceId],
    );

    return raws.map((raw) => MemberWorkspaceMapper.toModel(raw));
  }
}
