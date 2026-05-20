import { EntityManager } from 'typeorm';
import { DashboardSummaryModel } from '../../../domain/models/dashboard-summary.model';

export interface AdminDashboardSummaryService {
  getSummary(manager?: EntityManager): Promise<DashboardSummaryModel>;
}
