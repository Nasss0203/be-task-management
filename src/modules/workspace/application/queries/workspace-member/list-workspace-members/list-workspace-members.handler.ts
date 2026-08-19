import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WorkspaceMemberDetailResponseDto } from 'src/modules/workspace/application/dto/workspace-member/response/workspace-member.response.dto';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { ListWorkspaceMembersQuery } from './list-workspace-members.query';

@Injectable()
export class ListWorkspaceMembersHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async execute(
    query: ListWorkspaceMembersQuery,
  ): Promise<WorkspaceMemberDetailResponseDto[]> {
    if (!query.workspaceId?.trim()) {
      throw new BadRequestException('workspaceId is required');
    }

    const members = await this.workspaceMemberRepository.findDetailsByWorkspace(
      query.workspaceId,
    );

    return members.map((member) =>
      WorkspaceMemberDetailResponseDto.fromDomain(member),
    );
  }
}
