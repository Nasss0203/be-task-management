import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceMemberModel } from '../domain/models/workspace-member.model';
import { CreateWorkspaceMemberDto } from '../dto/workspace-member.dto';
import { type WorkspaceMemberRepository } from '../interfaces/repositories/workspace-member.repository.interface';
import { CreateWorkspaceMemberService } from '../interfaces/services/create-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkspaceMemberServiceImpl implements CreateWorkspaceMemberService {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository)
    private readonly repo: WorkspaceMemberRepository,
  ) {}
  async create(
    createWorkspaceMemberDto: CreateWorkspaceMemberDto,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberModel> {
    const create = await this.repo.create(createWorkspaceMemberDto, manager);

    return create;
  }
}
