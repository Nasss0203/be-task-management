import { Inject, Injectable } from '@nestjs/common';
import { ActivityAction } from 'src/modules/activity/domain/entities/activity.entity';
import { DashboardActivityResponseDto } from '../dto/response/my-dashboard.response.dto';
import {
  DashboardActivityRow,
  type DashboardRepository,
} from '../interfaces/repositories/dashboard.repository.interface';
import { DashboardActivityService } from '../interfaces/services/dashboard-activity.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class DashboardActivityServiceImpl implements DashboardActivityService {
  constructor(
    @Inject(DASHBOARD_TYPES.repositories.DashboardRepository)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getRecentActivities(
    userId: string,
    limit: number,
  ): Promise<DashboardActivityResponseDto[]> {
    const rows = await this.dashboardRepository.findRecentActivities(
      userId,
      limit,
    );

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      projectId: row.projectId,
      action: row.action,
      message: this.buildMessage(row),
      createdAt: row.createdAt,
    }));
  }

  private buildMessage(row: DashboardActivityRow): string {
    const title = this.readMetadataTitle(row.metadata);

    switch (row.action) {
      case ActivityAction.TASK_CREATED:
        return `Task "${title}" được tạo.`;
      case ActivityAction.TASK_UPDATED:
        return `Task "${title}" vừa được cập nhật.`;
      case ActivityAction.TASK_DELETED:
        return `Task "${title}" được chuyển vào thùng rác.`;
      case ActivityAction.TASK_RESTORED:
        return `Task "${title}" đã được khôi phục.`;
      case ActivityAction.TASK_ASSIGNED:
        return `Task "${title}" được gán người phụ trách.`;
      case ActivityAction.PROJECT_CREATED:
        return `Project "${title}" được tạo.`;
      case ActivityAction.PROJECT_UPDATED:
        return `Project "${title}" vừa được cập nhật.`;
      case ActivityAction.WORKSPACE_MEMBER_JOINED:
        return 'Workspace có thành viên mới.';
      default:
        return 'Có cập nhật mới trong workspace.';
    }
  }

  private readMetadataTitle(metadata: Record<string, unknown> | null): string {
    const title = metadata?.title;

    return typeof title === 'string' && title.trim() ? title : 'Untitled';
  }
}
