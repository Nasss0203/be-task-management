import { Inject, Injectable } from '@nestjs/common';
import { WorkspacePlanResponseDto } from '../../dto/response/dashboard/workspace-plan.response.dto';
import { type AdminWorkspacePlanRepository } from '../../interfaces/repositories/dashboard/admin-workspace-plan.repository.interface';
import { type AdminWorkspacePlanService } from '../../interfaces/services/dashboard/admin-workspace-plan.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminWorkspacePlanServiceImpl implements AdminWorkspacePlanService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminWorkspacePlanRepository)
    private readonly repository: AdminWorkspacePlanRepository,
  ) {}

  getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]> {
    return this.repository.getWorkspacePlan();
  }
}
