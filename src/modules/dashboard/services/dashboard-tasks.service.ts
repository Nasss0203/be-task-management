import { Inject, Injectable } from '@nestjs/common';
import {
  DashboardDeadlineResponseDto,
  DashboardRhythmBlockResponseDto,
  DashboardTaskResponseDto,
} from '../dto/response/my-dashboard.response.dto';
import {
  DashboardDateRange,
  DashboardTaskRow,
  type DashboardRepository,
} from '../interfaces/repositories/dashboard.repository.interface';
import { DashboardTasksService } from '../interfaces/services/dashboard-tasks.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class DashboardTasksServiceImpl implements DashboardTasksService {
  constructor(
    @Inject(DASHBOARD_TYPES.repositories.DashboardRepository)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  async getPriorityTasks(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardTaskResponseDto[]> {
    const rows = await this.dashboardRepository.findPriorityTasks(
      userId,
      range,
      limit,
    );

    return rows.map((row) => this.toTaskResponse(row));
  }

  async getRecentDeadlines(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardDeadlineResponseDto[]> {
    const rows = await this.dashboardRepository.findRecentDeadlines(
      userId,
      range,
      limit,
    );

    return rows.map((row) => ({
      ...this.toTaskResponse(row),
      remainingLabel: this.getRemainingLabel(row.dueAt, range.now),
    }));
  }

  buildRhythmBlocks(
    tasks: DashboardTaskResponseDto[],
  ): DashboardRhythmBlockResponseDto[] {
    const fallbackTimes = ['09:30', '14:00', '16:30'];

    return tasks.slice(0, 3).map((task, index) => ({
      time: task.startAt ? this.formatTime(task.startAt) : fallbackTimes[index],
      title: task.title,
      subtitle: this.buildTaskSubtitle(task),
      taskId: task.id,
    }));
  }

  private toTaskResponse(row: DashboardTaskRow): DashboardTaskResponseDto {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      projectId: row.projectId,
      title: row.title,
      workspaceName: row.workspaceName,
      projectName: row.projectName,
      priorityName: row.priorityName,
      priorityLevel: row.priorityLevel,
      statusName: row.statusName,
      dueAt: row.dueAt,
      startAt: row.startAt,
      estimateMinutes: row.estimateMinutes,
      progressPercent: this.getProgressPercent(row),
    };
  }

  private getProgressPercent(row: DashboardTaskRow): number {
    if (row.statusIsDone) return 100;

    const statusName = row.statusName?.toLowerCase() ?? '';

    if (statusName.includes('review')) return 80;
    if (statusName.includes('đang') || statusName.includes('doing')) return 65;
    if (statusName.includes('progress')) return 65;
    if (statusName.includes('chưa') || statusName.includes('todo')) return 20;
    if (statusName.includes('backlog')) return 12;

    return 50;
  }

  private getRemainingLabel(dueAt: Date | null, now: Date): string {
    if (!dueAt) return 'Chưa có hạn';

    const diffMs = dueAt.getTime() - now.getTime();
    if (diffMs < 0) return 'Quá hạn';

    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (hours <= 24) return `Còn ${hours} giờ`;

    const days = Math.ceil(hours / 24);
    if (days === 1) return 'Ngày mai';

    return `Còn ${days} ngày`;
  }

  private buildTaskSubtitle(task: DashboardTaskResponseDto): string {
    if (task.dueAt) {
      return `${task.projectName} / hạn ${this.formatTime(task.dueAt)}`;
    }

    if (task.priorityName) {
      return `${task.projectName} / ưu tiên ${task.priorityName}`;
    }

    return `${task.workspaceName} / ${task.projectName}`;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
