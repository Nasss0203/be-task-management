import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DashboardSummaryModel } from '../../domain/models/dashboard-summary.model';
import { type AdminDashboardSummaryRepository } from '../../interfaces/repositories/dashboard/admin-dashboard-summary.repository.interface';
import { AdminDashboardSummaryService } from '../../interfaces/services/dashboard/admin-dashboard-summary.service.interface';
import { ADMIN_TYPES } from '../../interfaces/types';

@Injectable()
export class AdminDashboardSummaryServiceImpl implements AdminDashboardSummaryService {
  constructor(
    @Inject(ADMIN_TYPES.repositories.AdminDashboardSummaryRepository)
    private readonly repo: AdminDashboardSummaryRepository,
  ) {}

  getSummary(manager?: EntityManager): Promise<DashboardSummaryModel> {
    return this.repo.getSummary(manager);
  }
}
