import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { type CreateWorkspaceMultiRepository } from '../interfaces/repositories/create-workspace.repository.interface';
import { type FindWorkspaceService } from '../interfaces/services/find.workspace.service.interface';
import {
  type UpdateWorkspaceInput,
  type UpdateWorkspaceService,
} from '../interfaces/services/update-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class UpdateWorkspaceServiceImpl implements UpdateWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.services.FindWorkspaceService)
    private readonly findWorkspaceService: FindWorkspaceService,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepository: CreateWorkspaceMultiRepository,
  ) {}

  async update({
    userId,
    workspaceId,
    name,
  }: UpdateWorkspaceInput): Promise<WorkspaceModel> {
    const workspace = await this.findWorkspaceService.findOneByWorkspaceId(
      userId,
      workspaceId,
    );

    return this.workspaceRepository.save(
      new WorkspaceModel(
        workspace.id,
        name ?? workspace.name,
        workspace.slug,
        workspace.planType,
        workspace.layoutMode,
        workspace.createdAt,
        workspace.updatedAt,
        workspace.deletedAt,
        workspace.deletedBy,
      ),
    );
  }
}
