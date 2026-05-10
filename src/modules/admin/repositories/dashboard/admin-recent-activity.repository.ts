import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { Repository } from 'typeorm';
import {
  RecentActivityLevel,
  RecentActivityResponseDto,
  RecentActivityType,
} from '../../dto/response/dashboard/recent-activity.response.dto';
import { AdminRecentActivityRepository } from '../../interfaces/repositories/dashboard/admin-recent-activity.repository.interface';

type WorkspaceCreatedRaw = {
  id: string;
  name: string;
  createdAt: Date;
};

type WorkspaceDeletedRaw = {
  id: string;
  name: string;
  deletedAt: Date;
};

type UserCreatedRaw = {
  id: string;
  email: string;
  createdAt: Date;
};

type ActivityInput = {
  id: string;
  title: string;
  description: string;
  type: RecentActivityType;
  level: RecentActivityLevel;
  createdAt: Date;
};

@Injectable()
export class AdminRecentActivityRepositoryImpl implements AdminRecentActivityRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getRecentActivities(): Promise<RecentActivityResponseDto[]> {
    const [workspaceCreated, workspaceDeleted, userCreated] = await Promise.all(
      [
        this.getRecentWorkspaceCreated(),
        this.getRecentWorkspaceDeleted(),
        this.getRecentUserCreated(),
      ],
    );

    const activities: ActivityInput[] = [
      ...workspaceCreated.map((item) => ({
        id: `workspace-created-${item.id}`,
        title: 'New workspace created',
        description: `Workspace "${item.name}" was created.`,
        type: 'workspace' as const,
        level: 'success' as const,
        createdAt: new Date(item.createdAt),
      })),

      ...workspaceDeleted.map((item) => ({
        id: `workspace-deleted-${item.id}`,
        title: 'Workspace deleted',
        description: `Workspace "${item.name}" was deleted.`,
        type: 'workspace' as const,
        level: 'warning' as const,
        createdAt: new Date(item.deletedAt),
      })),

      ...userCreated.map((item) => ({
        id: `user-created-${item.id}`,
        title: 'New user registered',
        description: `${item.email} created an account.`,
        type: 'user' as const,
        level: 'info' as const,
        createdAt: new Date(item.createdAt),
      })),
    ];

    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        level: item.level,
        createdAt: item.createdAt.toISOString(),
        time: this.formatRelativeTime(item.createdAt),
      }));
  }

  private getRecentWorkspaceCreated(): Promise<WorkspaceCreatedRaw[]> {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .select('"workspace"."id"', 'id')
      .addSelect('"workspace"."name"', 'name')
      .addSelect('"workspace"."created_at"', 'createdAt')
      .where('"workspace"."deleted_at" IS NULL')
      .orderBy('"workspace"."created_at"', 'DESC')
      .limit(5)
      .getRawMany<WorkspaceCreatedRaw>();
  }

  private getRecentWorkspaceDeleted(): Promise<WorkspaceDeletedRaw[]> {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .withDeleted()
      .select('"workspace"."id"', 'id')
      .addSelect('"workspace"."name"', 'name')
      .addSelect('"workspace"."deleted_at"', 'deletedAt')
      .where('"workspace"."deleted_at" IS NOT NULL')
      .orderBy('"workspace"."deleted_at"', 'DESC')
      .limit(5)
      .getRawMany<WorkspaceDeletedRaw>();
  }

  private getRecentUserCreated(): Promise<UserCreatedRaw[]> {
    return this.userRepository
      .createQueryBuilder('u')
      .select('"u"."id"', 'id')
      .addSelect('"u"."email"', 'email')
      .addSelect('"u"."created_at"', 'createdAt')
      .where('"u"."deleted_at" IS NULL')
      .orderBy('"u"."created_at"', 'DESC')
      .limit(5)
      .getRawMany<UserCreatedRaw>();
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-GB');
  }
}
