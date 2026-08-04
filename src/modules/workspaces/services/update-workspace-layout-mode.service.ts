import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { type CreateWorkspaceMultiRepository } from '../interfaces/repositories/create-workspace.repository.interface';
import { type FindWorkspaceService } from '../interfaces/services/find.workspace.service.interface';
import {
  UpdateWorkspaceLayoutModeInput,
  UpdateWorkspaceLayoutModeService,
} from '../interfaces/services/update-workspace-layout-mode.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateWorkspaceLayoutModeServiceImpl implements UpdateWorkspaceLayoutModeService {
  constructor(
    @Inject(WORKSPACE_TYPES.services.FindWorkspaceService)
    private readonly findWorkspaceService: FindWorkspaceService,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: CreateWorkspaceMultiRepository,
  ) {}

  async updateLayoutMode({
    userId,
    workspaceId,
    layoutMode,
  }: UpdateWorkspaceLayoutModeInput): Promise<WorkspaceModel> {
    const workspace = await this.findWorkspaceService.findOneByWorkspaceId(
      userId,
      workspaceId,
    );

    return this.workspaceRepository.save(
      new WorkspaceModel(
        workspace.id,
        workspace.name,
        workspace.slug,
        workspace.planType,
        layoutMode,
        workspace.createdAt,
        workspace.updatedAt,
        workspace.deletedAt,
        workspace.deletedBy,
        workspace.createdBy,
      ),
    );
  }
}
