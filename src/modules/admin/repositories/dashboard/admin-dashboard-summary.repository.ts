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
import { DashboardSummaryModel } from '../../domain/models/dashboard-summary.model';
import { AdminDashboardSummaryRepository } from '../../interfaces/repositories/dashboard/admin-dashboard-summary.repository.interface';

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
    // #region agent log
    fetch('http://127.0.0.1:7422/ingest/858f5ea4-3f7e-414d-bca0-e06f390439e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'408fe4'},body:JSON.stringify({sessionId:'408fe4',runId:'pre-fix',hypothesisId:'H1',location:'admin-dashboard-summary.repository.ts:getSummary',message:'before_counts',data:{hasManager:!!manager},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    try {
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
    } catch (e: unknown) {
      const err = e as { message?: string; driverError?: { message?: string } };
      // #region agent log
      fetch('http://127.0.0.1:7422/ingest/858f5ea4-3f7e-414d-bca0-e06f390439e6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'408fe4'},body:JSON.stringify({sessionId:'408fe4',runId:'pre-fix',hypothesisId:'H1',location:'admin-dashboard-summary.repository.ts:getSummary',message:'catch',data:{msg:String(err?.message),driver:String(err?.driverError?.message)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw e;
    }
  }
}
