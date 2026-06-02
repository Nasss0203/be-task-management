import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { EntityManager, Repository } from 'typeorm';
import { Workspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { FindWorkspaceRepository } from '../interfaces/repositories/find.workspace.repository.interface';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class FindWorkspaceRepositoryImpl implements FindWorkspaceRepository {
  constructor(
    @InjectRepository(UserWorkspace)
    private readonly repoUserWorkspace: Repository<UserWorkspace>,

    @InjectRepository(Workspace)
    private readonly repoWorkspace: Repository<Workspace>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<UserWorkspace> {
    return manager
      ? manager.getRepository(UserWorkspace)
      : this.repoUserWorkspace;
  }

  // Version 1

  // async findWorkspacesByUserId(
  //   userId: string,
  //   manager?: EntityManager,
  // ): Promise<Workspace[]> {
  //   const rows = await this.getRepo(manager)
  //     .createQueryBuilder('uw')
  //     .innerJoinAndSelect('uw.workspace', 'workspace')
  //     .where('uw.user_id = :userId', { userId })
  //     .andWhere('workspace.deletedAt IS NULL')
  //     .orderBy('uw.lastOpenedAt', 'DESC', 'NULLS LAST')
  //     .addOrderBy('workspace.createdAt', 'DESC')
  //     .getMany();

  //   return rows.map((row) => row.workspace);
  // }

  // Version 2s
  async findWorkspacesByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel[]> {
    const rows = await this.getRepo(manager).find({
      where: {
        user_id: userId,
      },
      relations: {
        workspace: true,
      },
      order: {
        lastOpenedAt: 'DESC',
      },
    });

    return rows
      .filter((row) => row.workspace && !row.workspace.deletedAt)
      .map((row) => WorkspaceMapper.toModel(row.workspace));
  }

  async findOneWorkspaceById(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceModel | null> {
    const row = await this.getRepo(manager).findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
      },
      relations: {
        workspace: true,
      },
    });

    if (!row || !row.workspace || row.workspace.deletedAt) {
      return null;
    }

    return WorkspaceMapper.toModel(row.workspace);
  }
}
