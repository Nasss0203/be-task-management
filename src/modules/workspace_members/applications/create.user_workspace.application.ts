import { Inject, Injectable } from '@nestjs/common';
import { CreateUserWorkspaceDto } from '../dto/create-user_workspace.dto';
import { UserWorkspaceResponseDto } from '../dto/response/user_workspace.response.dto';
import { CreateUserWorkspaceApplication } from '../interfaces/applications/create.user_workspace.application.interface';
import { type CreateUserWorkspaceService } from '../interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceMemeberMapper } from '../mapper/user_workspace.mapper';

@Injectable()
export class CreateUserWorkspaceApplicationImpl implements CreateUserWorkspaceApplication {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService)
    private readonly service: CreateUserWorkspaceService,
  ) {}

  async create(
    createUserWorkspaceDto: CreateUserWorkspaceDto,
  ): Promise<UserWorkspaceResponseDto> {
    const model = await this.service.create(createUserWorkspaceDto);
    return WorkspaceMemeberMapper.toResponse(model);
  }
}
