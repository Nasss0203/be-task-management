import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { WorkspaceMemberSummaryModel } from '../domain/models/workspace-member-summary.model';
import { type AdminWorkspaceMemberSummaryRepository } from '../interfaces/repositories/admin-workspace-member-summary.repository.interface';
import { AdminWorkspaceMemberSummaryService } from '../interfaces/services/admin-workspace-member-summary.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class AdminWorkspaceMemberSummaryServiceImpl implements AdminWorkspaceMemberSummaryService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.AdminWorkspaceMemberSummaryRepository)
    private readonly repo: AdminWorkspaceMemberSummaryRepository,
  ) {}

  getMemberSummary(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberSummaryModel> {
    return this.repo.getMemberSummary(workspaceId, manager);
  }
}
