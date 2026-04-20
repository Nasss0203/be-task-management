import { Inject, Injectable } from '@nestjs/common';

import { MemberWorkspaceResponseDto } from '../dto/response/user_workspace.response.dto';
import { FindAllMemberApplication } from '../interfaces/applications/find-user-workspace.application.interface';
import { type FindAllMemberService } from '../interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { MemberWorkspaceMapper } from '../mapper/member-workspace.mapper';

@Injectable()
export class FindAllMemberApplicationImpl implements FindAllMemberApplication {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.services.FindAllMemberService)
    private readonly findAllMemberService: FindAllMemberService,
  ) {}

  async findAllMember(
    workspaceId: string,
  ): Promise<MemberWorkspaceResponseDto[]> {
    const members = await this.findAllMemberService.findAllMember(workspaceId);

    return members.map((member) => MemberWorkspaceMapper.toResponse(member));
  }
}
