import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { UserActivity } from 'src/modules/user_activity/domain/entities/user_activity.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  PlanTypeWorkspace,
  Workspace,
} from 'src/modules/workspaces/domain/entities/workspace.entity';
import { EntityManager, Repository } from 'typeorm';
import { DashboardSummaryModel } from '../../domain/models/dashboard-summary.model';
import { AdminDashboardSummaryRepository } from '../../interfaces/repositories/dashboard/admin-dashboard-summary.repository.interface';

type CountRaw = {
  count: string;
};

@Injectable()
export class AdminDashboardSummaryRepositoryImpl implements AdminDashboardSummaryRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(UserActivity)
    private readonly userActivityRepo: Repository<UserActivity>,
  ) {}

  private getUserRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.userRepo;
  }

  private getWorkspaceRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.workspaceRepo;
  }

  private getProjectRepo(manager?: EntityManager): Repository<Project> {
    return manager ? manager.getRepository(Project) : this.projectRepo;
  }

  private getTaskRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.taskRepo;
  }

  private getUserActivityRepo(
    manager?: EntityManager,
  ): Repository<UserActivity> {
    return manager
      ? manager.getRepository(UserActivity)
      : this.userActivityRepo;
  }

  async getSummary(manager?: EntityManager): Promise<DashboardSummaryModel> {
    const [
      totalUsers,
      totalWorkspaces,
      totalProjects,
      totalTasks,
      paidWorkspaces,
      activeUsersLast30Days,
    ] = await Promise.all([
      this.getUserRepo(manager).count(),
      this.getWorkspaceRepo(manager).count(),
      this.getProjectRepo(manager).count(),
      this.getTaskRepo(manager).count(),
      this.getWorkspaceRepo(manager).count({
        where: { planType: PlanTypeWorkspace.PRO },
      }),
      this.countActiveUsersLast30Days(manager),
    ]);

    return new DashboardSummaryModel(
      totalUsers,
      totalWorkspaces,
      totalProjects,
      totalTasks,
      paidWorkspaces,
      activeUsersLast30Days,
    );
  }

  private async countActiveUsersLast30Days(
    manager?: EntityManager,
  ): Promise<number> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    fromDate.setHours(0, 0, 0, 0);

    const raw = await this.getUserActivityRepo(manager)
      .createQueryBuilder('activity')
      .select('COUNT(DISTINCT "activity"."user_id")', 'count')
      .where('"activity"."created_at" >= :fromDate', { fromDate })
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }
}
