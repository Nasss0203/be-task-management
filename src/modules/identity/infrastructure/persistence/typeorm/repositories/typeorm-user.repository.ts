import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from 'src/modules/identity/domain/aggregates/user/user.model';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import {
  CreateGoogleUserInput,
  CreateLocalUserInput,
  SearchInviteUsersInput,
  SearchInviteUsersOutput,
  UserRecord,
  UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { User } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { UserMapper } from 'src/modules/identity/infrastructure/persistence/typeorm/mappers/users.mapper';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { Brackets, EntityManager, Repository } from 'typeorm';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<User> {
    return context
      ? (context as EntityManager).getRepository(User)
      : this.userRepo;
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string): Promise<UserRecord | null> {
    return this.userRepo.findOne({ where: { googleId } });
  }

  findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<UserRecord | null> {
    return this.userRepo.findOne({
      where: [{ email }, { username }],
    });
  }

  findByEmailAndUsername(
    email: string,
    username: string,
  ): Promise<UserRecord | null> {
    return this.userRepo.findOne({
      where: { email, username },
    });
  }

  findByEmailVerificationToken(token: string): Promise<UserRecord | null> {
    return this.userRepo.findOne({ where: { emailVerificationToken: token } });
  }

  findByResetPasswordToken(token: string): Promise<UserRecord | null> {
    return this.userRepo.findOne({ where: { resetPasswordToken: token } });
  }

  findProfileById(id: string): Promise<UserRecord | null> {
    return this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        googleId: true,
        avatarUrl: true,
        isActive: true,
        systemRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createLocalUser(
    input: CreateLocalUserInput,
    context?: PersistenceContext,
  ): Promise<UserRecord> {
    const repo = context
      ? (context as EntityManager).getRepository(User)
      : this.userRepo;
    const user = repo.create({
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      systemRole: SystemRole.USER,
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: input.emailVerificationToken,
      emailVerificationExpires: input.emailVerificationExpires,
      googleId: null,
      avatarUrl: null,
    });

    return repo.save(user);
  }

  async createGoogleUser(
    input: CreateGoogleUserInput,
    context?: PersistenceContext,
  ): Promise<UserRecord> {
    const repo = this.getRepo(context);

    const user = repo.create({
      email: input.email,
      username: input.username,
      googleId: input.googleId,
      avatarUrl: input.avatarUrl,
      passwordHash: null,
      isActive: true,
      isEmailVerified: true,
    });

    return repo.save(user);
  }
  save(user: UserRecord): Promise<UserRecord> {
    return this.userRepo.save(user as User);
  }

  async findUserByUsername(username: string): Promise<UserModel | null> {
    const user = await this.userRepo.findOne({ where: { username } });
    return user ? UserMapper.toModel(user) : null;
  }

  async findUserByEmail(email: string): Promise<UserModel | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    return user ? UserMapper.toModel(user) : null;
  }

  async findUserById(id: string): Promise<UserModel | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    return user ? UserMapper.toModel(user) : null;
  }

  async searchUsers(
    keyword: string,
    context?: PersistenceContext,
  ): Promise<UserModel[]> {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) return [];

    const users = await this.getRepo(context)
      .createQueryBuilder('u')
      .where('u.username ILIKE :keyword', {
        keyword: `%${trimmedKeyword}%`,
      })
      .orWhere('u.email ILIKE :keyword', {
        keyword: `%${trimmedKeyword}%`,
      })
      .limit(10)
      .getMany();

    return users.map((user) => UserMapper.toModel(user));
  }

  async searchInviteUsers(
    input: SearchInviteUsersInput,
    context?: PersistenceContext,
  ): Promise<SearchInviteUsersOutput[]> {
    const trimmedKeyword = input.keyword.trim();
    if (!trimmedKeyword) return [];

    const rows = await this.getRepo(context)
      .createQueryBuilder('u')
      .leftJoin('user_profiles', 'up', 'up.user_id = u.id')
      .leftJoin(
        'workspace_members',
        'uw',
        'uw.user_id = u.id AND uw.workspace_id = :workspaceId',
        { workspaceId: input.workspaceId },
      )
      .leftJoin(
        'workspace_invites',
        'wi',
        'LOWER(wi.email) = LOWER(u.email) AND wi.workspace_id = :workspaceId AND wi.status = :pendingStatus',
        { workspaceId: input.workspaceId, pendingStatus: 'PENDING' },
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

    return rows.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      status: row.member_id
        ? 'MEMBER'
        : row.invite_id
          ? 'PENDING_INVITE'
          : 'CAN_INVITE',
    }));
  }
}
