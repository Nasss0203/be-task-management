import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Board } from 'src/modules/boards/domain/entities/board.entity';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceOverviewModel } from '../../domain/models/workspace-overview.model';
import { AdminWorkspaceOverviewRepository } from '../../interfaces/repositories/dashboard/admin-workspace-overview.repository.interface';

@Injectable()
export class AdminWorkspaceOverviewRepositoryImpl implements AdminWorkspaceOverviewRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,

    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepo: Repository<UserWorkspace>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  private getWorkspaceRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.workspaceRepo;
  }

  private getUserWorkspaceRepo(
    manager?: EntityManager,
  ): Repository<UserWorkspace> {
    return manager
      ? manager.getRepository(UserWorkspace)
      : this.userWorkspaceRepo;
  }

  private getProjectRepo(manager?: EntityManager): Repository<Project> {
    return manager ? manager.getRepository(Project) : this.projectRepo;
  }

  private getBoardRepo(manager?: EntityManager): Repository<Board> {
    return manager ? manager.getRepository(Board) : this.boardRepo;
  }

  private getTaskRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.taskRepo;
  }

  async getOverview(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceOverviewModel> {
    const workspace = await this.getWorkspaceRepo(manager).findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const [memberCount, projectCount, boardCount, taskCount] =
      await Promise.all([
        this.getUserWorkspaceRepo(manager).count({
          where: { workspace_id: workspaceId },
        }),
        this.getProjectRepo(manager).count({
          where: { workspace_id: workspaceId },
        }),
        this.getBoardRepo(manager).count({
          where: { workspaceId },
        }),
        this.getTaskRepo(manager).count({
          where: { workspaceId },
        }),
      ]);

    return new WorkspaceOverviewModel(
      workspace.id,
      workspace.name,
      workspace.slug,
      workspace.planType,
      workspace.createdAt,
      workspace.updatedAt,
      memberCount,
      projectCount,
      boardCount,
      taskCount,
    );
  }
}
