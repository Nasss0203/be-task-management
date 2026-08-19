import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceMemberDetailModel } from '../domain/models/workspace-member.model';
import { type FindWorkspaceMemberRepository } from '../interfaces/repositories/find-workspace-member.repository.interface';
import { FindWorkspaceMemberService } from '../interfaces/services/find-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';

@Injectable()
export class FindWorkspaceMemberServiceImpl implements FindWorkspaceMemberService {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.repositories.FindWorkspaceMemberRepository)
    private readonly findWorkspaceMemberRepository: FindWorkspaceMemberRepository,
  ) {}

  async findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel[]> {
    if (!workspaceId?.trim()) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findWorkspaceMemberRepository.findAllMember(
      workspaceId,
      manager,
    );
  }

  async findMemberInWorkspace(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberDetailModel | null> {
    if (!workspaceId?.trim()) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    return await this.findWorkspaceMemberRepository.findMemberInWorkspace(
      workspaceId,
      userId,
      manager,
    );
  }
}
