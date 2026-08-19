import { Inject, Injectable } from '@nestjs/common';

import { WorkspaceMemberDetailResponseDto } from '../../../dto/response/workspace-member.response.dto';
import { type FindWorkspaceMemberService } from '../../../interfaces/services/find-workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../../../interfaces/types';
import { WorkspaceMemberDetailMapper } from '../../../mapper/workspace-member-detail.mapper';
import { ListWorkspaceMembersQuery } from './list-workspace-members.query';

@Injectable()
export class ListWorkspaceMembersHandler {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService)
    private readonly findWorkspaceMemberService: FindWorkspaceMemberService,
  ) {}

  async execute(
    query: ListWorkspaceMembersQuery,
  ): Promise<WorkspaceMemberDetailResponseDto[]> {
    const members = await this.findWorkspaceMemberService.findAllMember(
      query.workspaceId,
    );

    return members.map((member) =>
      WorkspaceMemberDetailMapper.toResponse(member),
    );
  }
}
