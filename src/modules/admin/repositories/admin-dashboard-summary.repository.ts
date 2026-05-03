import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  PlanTypeWorkspace,
  Workspace,
} from 'src/modules/workspaces/domain/entities/workspace.entity';
import { EntityManager, Repository } from 'typeorm';
import { DashboardSummaryModel } from '../domain/models/dashboard-summary.model';
import { AdminDashboardSummaryRepository } from '../interfaces/repositories/admin-dashboard-summary.repository.interface';

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

  async getSummary(manager?: EntityManager): Promise<DashboardSummaryModel> {
    const [
      totalUsers,
      totalWorkspaces,
      totalProjects,
      totalTasks,
      paidWorkspaces,
    ] = await Promise.all([
      this.getUserRepo(manager).count(),
      this.getWorkspaceRepo(manager).count(),
      this.getProjectRepo(manager).count(),
      this.getTaskRepo(manager).count(),
      this.getWorkspaceRepo(manager).count({
        where: { planType: PlanTypeWorkspace.PRO },
      }),
    ]);

    return new DashboardSummaryModel(
      totalUsers,
      totalWorkspaces,
      totalProjects,
      totalTasks,
      paidWorkspaces,
    );
  }
}
