import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  type AccessWorkspaceRepository,
  WorkspaceAccessModel,
} from '../interfaces/repositories/access-workspace.repository.interface';
import { AccessWorkspaceService } from '../interfaces/services/access-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class AccessWorkspaceServiceImpl implements AccessWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.AccessWorkspaceRepository)
    private readonly accessWorkspaceRepository: AccessWorkspaceRepository,
  ) {}

  async getWorkspaceAccess(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceAccessModel> {
    const access = await this.accessWorkspaceRepository.findWorkspaceAccess(
      userId,
      workspaceId,
    );

    if (!access) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return access;
  }
}
