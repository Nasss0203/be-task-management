import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WorkspaceMemberDetailResponseDto } from 'src/modules/workspace/application/dto/workspace-member/response/workspace-member.response.dto';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { ListWorkspacePeopleQuery } from './list-workspace-people.query';

@Injectable()
export class ListWorkspacePeopleHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
  ) {}

  async execute(
    query: ListWorkspacePeopleQuery,
  ): Promise<WorkspaceMemberDetailResponseDto[]> {
    if (!query.workspaceId?.trim()) {
      throw new BadRequestException('workspaceId is required');
    }

    const people = await this.workspaceMemberRepository.findPeopleByWorkspace(
      query.workspaceId,
    );

    return people.map((person) =>
      WorkspaceMemberDetailResponseDto.fromDomain(person),
    );
  }
}
