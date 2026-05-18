import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { User } from '../domain/entities/user.entity';
import { UserModel } from '../domain/models/user.model';
import {
  FindUserRepository,
  InviteUserSuggestionStatus,
  SearchInviteUsersRepositoryInput,
  SearchInviteUsersRepositoryOutput,
} from '../interfaces/repositories/find-user.repository.interface';
import { UserMapper } from '../mapper/users.mapper';

@Injectable()
export class FindUserRepositoryImpl implements FindUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repoUser: Repository<User>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.repoUser;
  }

  async findUserByUsername(username: string): Promise<UserModel | null> {
    const user = await this.repoUser.findOne({
      where: { username },
    });

    return user ? UserMapper.toModel(user) : null;
  }
  async findUserByEmail(email: string): Promise<UserModel | null> {
    const user = await this.repoUser.findOne({
      where: { email },
    });

    return user ? UserMapper.toModel(user) : null;
  }
  async findUserById(id: string): Promise<UserModel | null> {
    const user = await this.repoUser.findOne({
      where: { id },
    });

    return user ? UserMapper.toModel(user) : null;
  }

  async searchUsers(
    keyword: string,
    manager?: EntityManager,
  ): Promise<UserModel[]> {
    const repo = this.getRepo(manager);

    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) return [];

    const users = await repo
      .createQueryBuilder('u')
      .where('u.username ILIKE :keyword', {
        keyword: `%${trimmedKeyword}%`,
      })
      .orWhere('u.email ILIKE :keyword', {
        keyword: `%${trimmedKeyword}%`,
      })
      .limit(10)
      .getMany();

    return users.map(UserMapper.toModel);
  }

  async searchInviteUsers(
    input: SearchInviteUsersRepositoryInput,
    manager?: EntityManager,
  ): Promise<SearchInviteUsersRepositoryOutput[]> {
    const repo = this.getRepo(manager);

    const trimmedKeyword = input.keyword.trim();

    if (!trimmedKeyword) return [];

    const rows = await repo
      .createQueryBuilder('u')
      .leftJoin('user_profiles', 'up', 'up.user_id = u.id')
      .leftJoin(
        'user_workspaces',
        'uw',
        `
        uw.user_id = u.id
        AND uw.workspace_id = :workspaceId
      `,
        {
          workspaceId: input.workspaceId,
        },
      )
      .leftJoin(
        'workspace_invites',
        'wi',
        `
        LOWER(wi.email) = LOWER(u.email)
        AND wi.workspace_id = :workspaceId
        AND wi.status = :pendingStatus
      `,
        {
          workspaceId: input.workspaceId,
          pendingStatus: 'PENDING',
        },
      )
      .where('u.id != :currentUserId', {
        currentUserId: input.currentUserId,
      })
      .andWhere('u.deleted_at IS NULL')
      .andWhere('u.is_active = true')
      .andWhere(
        new Brackets((qb) => {
          qb.where('u.username ILIKE :keyword', {
            keyword: `%${trimmedKeyword}%`,
          })
            .orWhere('u.email ILIKE :keyword', {
              keyword: `%${trimmedKeyword}%`,
            })
            .orWhere('up.full_name ILIKE :keyword', {
              keyword: `%${trimmedKeyword}%`,
            });
        }),
      )
      .select([
        'u.id AS user_id',
        'u.username AS username',
        'u.email AS email',
        'up.full_name AS full_name',
        'u.avatar_url AS avatar_url',
        'uw.id AS member_id',
        'wi.id AS invite_id',
      ])
      .limit(10)
      .getRawMany<{
        user_id: string;
        username: string | null;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
        member_id: string | null;
        invite_id: string | null;
      }>();

    return rows.map((row) => {
      let status: InviteUserSuggestionStatus = 'CAN_INVITE';

      if (row.member_id) {
        status = 'MEMBER';
      } else if (row.invite_id) {
        status = 'PENDING_INVITE';
      }

      return {
        user_id: row.user_id,
        username: row.username,
        email: row.email,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
        status,
      };
    });
  }
}
