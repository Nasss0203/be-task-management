import { Inject, Injectable } from '@nestjs/common';
import { CreateWorkspaceMultiServiceDto } from '../dto/create-workspace.dto';
import { WorkspaceResponseDto } from '../dto/response/workspaces.response.dto';
import { CreateWorkspaceApplication } from '../interfaces/applications/create-workspace.application.interface';
import { type CreateWorkspaceService } from '../interfaces/services/create-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceMapper } from '../mapper/workspace.mapper';

@Injectable()
export class CreateWorkspaceApplicationImpl implements CreateWorkspaceApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.services.CreateWorkspaceService)
    private readonly service: CreateWorkspaceService,
  ) {}

  async create({
    userId,
    CreateWorkspaceMultiServiceDto,
  }: {
    userId: string;
    CreateWorkspaceMultiServiceDto: CreateWorkspaceMultiServiceDto;
  }): Promise<WorkspaceResponseDto> {
    const model = await this.service.create({
      userId,
      CreateWorkspaceMultiServiceDto,
    });

    return WorkspaceMapper.toResponse(model);
  }

  async createDeault({
    userId,
    CreateWorkspaceMultiServiceDto,
  }: {
    userId: string;
    CreateWorkspaceMultiServiceDto: CreateWorkspaceMultiServiceDto;
  }): Promise<WorkspaceResponseDto> {
    const model = await this.service.createDefault({
      userId,
      CreateWorkspaceMultiServiceDto,
    });

    return WorkspaceMapper.toResponse(model);
  }
}
