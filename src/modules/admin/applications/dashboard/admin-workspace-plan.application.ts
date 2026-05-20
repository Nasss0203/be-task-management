import { Inject, Injectable } from '@nestjs/common';
import { WorkspacePlanResponseDto } from '../../dto/response/dashboard/workspace-plan.response.dto';
import { type AdminWorkspacePlanApplication } from '../../interfaces/applications/dashboard/admin-workspace-plan.application.interface';
import { type AdminWorkspacePlanService } from '../../interfaces/services/dashboard/admin-workspace-plan.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminWorkspacePlanApplicationImpl implements AdminWorkspacePlanApplication {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminWorkspacePlanService)
    private readonly service: AdminWorkspacePlanService,
  ) {}

  getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]> {
    return this.service.getWorkspacePlan();
  }
}
