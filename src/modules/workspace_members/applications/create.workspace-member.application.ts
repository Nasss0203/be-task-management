import { Inject, Injectable } from '@nestjs/common';
import { CreateWorkspaceMemberDto } from '../dto/create-workspace_member.dto';
import { WorkspaceMemberResponseDto } from '../dto/response/workspace-member.response.dto';
import { CreateWorkspaceMemberApplication } from '../interfaces/applications/create.work-member.application.interface';
import { type CreateWorkspaceMemberService } from '../interfaces/services/create.workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from '../interfaces/types';
import { WorkspaceMemeberMapper } from '../mapper/workspace-member.mapper';

@Injectable()
export class CreateWorkspaceMemberApplicationImpl implements CreateWorkspaceMemberApplication {
  constructor(
    @Inject(WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService)
    private readonly service: CreateWorkspaceMemberService,
  ) {}

  async create(
    createWorkspaceMemberDto: CreateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberResponseDto> {
    const model = await this.service.create(createWorkspaceMemberDto);
    return WorkspaceMemeberMapper.toResponse(model);
  }
}
