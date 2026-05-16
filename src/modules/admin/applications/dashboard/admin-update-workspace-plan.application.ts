import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { WorkspaceMapper } from 'src/modules/workspaces/mapper/workspace.mapper';
import { UpdateWorkspacePlanDto } from '../../dto/response/dashboard/update-workspace-plan.dto';
import { AdminUpdateWorkspacePlanApplication } from '../../interfaces/applications/dashboard/admin-update-workspace-plan.application.interface';
import { ADMIN_TYPES } from '../../interfaces/types';
import { type AdminUpdateWorkspacePlanService } from '../../services/dashboard/admin-update-workspace-plan.service.interface';

@Injectable()
export class AdminUpdateWorkspacePlanApplicationImpl implements AdminUpdateWorkspacePlanApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminUpdateWorkspacePlanService)
    private readonly service: AdminUpdateWorkspacePlanService,
  ) {}

  async updatePlan(
    workspaceId: string,
    dto: UpdateWorkspacePlanDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.service.updatePlan(workspaceId, dto.planType);

    return WorkspaceMapper.toResponse(workspace);
  }
}
