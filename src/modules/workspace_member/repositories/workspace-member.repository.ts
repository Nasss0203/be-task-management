import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceMember } from '../domain/entities/workspace-member.entity';
import { WorkspaceMemberModel } from '../domain/models/workspace-member.model';
import {
  type SaveWorkspaceMemberInput,
  WorkspaceMemberRepository,
} from '../interfaces/repositories/workspace-member.repository.interface';
import { WorkspaceMemberMapper } from '../mapper/workspace-member.mapper';

@Injectable()
export class WorkspaceMemberRepositoryImpl implements WorkspaceMemberRepository {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly repo: Repository<WorkspaceMember>,
  ) {}

  private resolveRepo(manager?: EntityManager): Repository<WorkspaceMember> {
    return manager ? manager.getRepository(WorkspaceMember) : this.repo;
  }

  async create(
    input: SaveWorkspaceMemberInput,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberModel> {
    const repo = this.resolveRepo(manager);
    const entity = WorkspaceMemberMapper.toEntity(input);
    const saved = await repo.save(entity);

    return WorkspaceMemberMapper.toModel(saved);
  }

  async deleteByUserId(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.resolveRepo(manager);
    await repo.delete({ workspace_id: workspaceId, user_id: userId });
  }

  async updateRole(
    workspaceId: string,
    userId: string,
    roleName: WorkspaceMemberModel['role_name'],
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.resolveRepo(manager);
    await repo.update(
      { workspace_id: workspaceId, user_id: userId },
      { role_name: roleName },
    );
  }
}
