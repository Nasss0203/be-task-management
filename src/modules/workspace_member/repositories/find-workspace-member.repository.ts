import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { WorkspaceMember } from '../domain/entities/workspace-member.entity';
import { WorkspaceMemberDetailModel } from '../domain/models/workspace-member.model';
import { FindWorkspaceMemberRepository } from '../interfaces/repositories/find-workspace-member.repository.interface';
import {
  WorkspaceMemberDetailMapper,
  WorkspaceMemberDetailRaw,
} from '../mapper/workspace-member-detail.mapper';

@Injectable()
export class FindWorkspaceMemberRepositoryImpl implements FindWorkspaceMemberRepository {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly repoWorkspaceMember: Repository<WorkspaceMember>,

    private readonly dataSource: DataSource,
  ) {}

  private getRepo(manager?: EntityManager): Repository<WorkspaceMember> {
    return manager
      ? manager.getRepository(WorkspaceMember)
      : this.repoWorkspaceMember;
  }

  async findMemberInWorkspace(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel | null> {
    const repo = manager
      ? manager.getRepository(WorkspaceMember)
      : this.dataSource.getRepository(WorkspaceMember);

    const raw = await repo
      .createQueryBuilder('uw')
      .innerJoin('users', 'u', 'u.id = uw.user_id')
      .select([
        'uw.id as id',
        'uw.workspace_id as workspace_id',
        'uw.user_id as user_id',
        'u.username as full_name',
        'u.email as email',
        'NULL::text as avatar_url',
        'uw.role_name as role_name',
        'uw.last_opened_at as "lastOpenedAt"',
        'uw.joined_at as "joinedAt"',
      ])
      .addSelect('0', 'taskCount')
      .where('uw.workspace_id = :workspaceId', { workspaceId })
      .andWhere('uw.user_id = :userId', { userId })
      .getRawOne<WorkspaceMemberDetailRaw>();

    if (!raw) return null;

    return WorkspaceMemberDetailMapper.toModel(raw);
  }

  async findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel[]> {
    const executor = manager ?? this.dataSource.manager;
    const raws = await executor.query<WorkspaceMemberDetailRaw[]>(
      `
        SELECT
          uw.id AS id,
          uw.workspace_id AS workspace_id,
          uw.user_id AS user_id,
          u.username AS full_name,
          u.email AS email,
          NULL::text AS avatar_url,
          uw.role_name AS role_name,
          uw.last_opened_at AS "lastOpenedAt",
          uw.joined_at AS "joinedAt",
          0::int AS "taskCount"
        FROM workspace_members uw
        INNER JOIN users u
          ON u.id = uw.user_id
        WHERE uw.workspace_id = $1
        GROUP BY
          uw.id,
          uw.workspace_id,
          uw.user_id,
          u.username,
          u.email,
          uw.role_name,
          uw.last_opened_at,
          uw.joined_at
      `,
      [workspaceId],
    );

    return raws.map((raw) => WorkspaceMemberDetailMapper.toModel(raw));
  }
}
