import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { WorkspaceTrashRepository } from '../interfaces/repositories/workspace-trash.repository.interface';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class WorkspaceTrashRepositoryImpl implements WorkspaceTrashRepository {
  constructor(
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepo: Repository<UserWorkspace>,

    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  private getUserWorkspaceRepo(
    manager?: EntityManager,
  ): Repository<UserWorkspace> {
    return manager
      ? manager.getRepository(UserWorkspace)
      : this.userWorkspaceRepo;
  }

  private getWorkspaceRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.workspaceRepo;
  }

  async findDeletedWorkspacesByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel[]> {
    const rows = await this.getUserWorkspaceRepo(manager).find({
      where: {
        user_id: userId,
        workspace: {
          deletedAt: Not(IsNull()),
        },
      },
      relations: {
        workspace: true,
      },
      withDeleted: true,
      order: {
        lastOpenedAt: 'DESC',
      },
    });

    return rows
      .filter((row) => row.workspace && row.workspace.deletedAt)
      .map((row) => WorkspaceMapper.toModel(row.workspace));
  }

  async findDeletedWorkspaceById(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel | null> {
    const row = await this.getUserWorkspaceRepo(manager).findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
        workspace: {
          deletedAt: Not(IsNull()),
        },
      },
      relations: {
        workspace: true,
      },
      withDeleted: true,
    });

    if (!row?.workspace?.deletedAt) {
      return null;
    }

    return WorkspaceMapper.toModel(row.workspace);
  }

  async softDeleteWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel | null> {
    const membership = await this.getUserWorkspaceRepo(manager).findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
      },
      relations: {
        workspace: true,
      },
    });

    if (!membership?.workspace || membership.workspace.deletedAt) {
      return null;
    }

    const repo = this.getWorkspaceRepo(manager);

    await repo.update(workspaceId, {
      deletedBy: userId,
    });
    await repo.softDelete(workspaceId);

    const deletedWorkspace = await repo.findOne({
      where: {
        id: workspaceId,
      },
      withDeleted: true,
    });

    return deletedWorkspace ? WorkspaceMapper.toModel(deletedWorkspace) : null;
  }

  async restoreWorkspace(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel | null> {
    const deletedWorkspace = await this.findDeletedWorkspaceById(
      userId,
      workspaceId,
      manager,
    );

    if (!deletedWorkspace) {
      return null;
    }

    const repo = this.getWorkspaceRepo(manager);

    await repo.restore(workspaceId);
    await repo.update(workspaceId, {
      deletedBy: null,
    });

    const restoredWorkspace = await repo.findOne({
      where: {
        id: workspaceId,
      },
    });

    return restoredWorkspace
      ? WorkspaceMapper.toModel(restoredWorkspace)
      : null;
  }

  async removeWorkspaceFromUserTrash(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getUserWorkspaceRepo(manager);

    const membership = await repo.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
        workspace: {
          deletedAt: Not(IsNull()),
        },
      },
      relations: {
        workspace: true,
      },
      withDeleted: true,
    });

    if (membership?.workspace?.deletedAt) {
      await repo.delete({
        user_id: userId,
        workspace_id: workspaceId,
      });
    }
  }
}
