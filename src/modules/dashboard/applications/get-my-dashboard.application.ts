import { Inject, Injectable } from '@nestjs/common';
import {
  DashboardFocusResponseDto,
  DashboardStatsResponseDto,
  MyDashboardResponseDto,
} from '../dto/response/my-dashboard.response.dto';
import {
  GetMyDashboardApplication,
  GetMyDashboardInput,
} from '../interfaces/applications/get-my-dashboard.application.interface';
import { DashboardDateRange } from '../interfaces/repositories/dashboard.repository.interface';
import { type DashboardActivityService } from '../interfaces/services/dashboard-activity.service.interface';
import { type DashboardStatsService } from '../interfaces/services/dashboard-stats.service.interface';
import { type DashboardSuggestionsService } from '../interfaces/services/dashboard-suggestions.service.interface';
import { type DashboardTasksService } from '../interfaces/services/dashboard-tasks.service.interface';
import { type DashboardWorkspacesService } from '../interfaces/services/dashboard-workspaces.service.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Injectable()
export class GetMyDashboardApplicationImpl implements GetMyDashboardApplication {
  constructor(
    @Inject(DASHBOARD_TYPES.services.DashboardStatsService)
    private readonly dashboardStatsService: DashboardStatsService,

    @Inject(DASHBOARD_TYPES.services.DashboardTasksService)
    private readonly dashboardTasksService: DashboardTasksService,

    @Inject(DASHBOARD_TYPES.services.DashboardWorkspacesService)
    private readonly dashboardWorkspacesService: DashboardWorkspacesService,

    @Inject(DASHBOARD_TYPES.services.DashboardActivityService)
    private readonly dashboardActivityService: DashboardActivityService,

    @Inject(DASHBOARD_TYPES.services.DashboardSuggestionsService)
    private readonly dashboardSuggestionsService: DashboardSuggestionsService,
  ) {}

  async getMyDashboard(
    input: GetMyDashboardInput,
  ): Promise<MyDashboardResponseDto> {
    const date = this.resolveDate(input.date);
    const timezone = input.timezone?.trim() || 'Asia/Bangkok';
    const limit = input.limit ?? 4;
    const range = this.buildDateRange(date);

    const [
      stats,
      priorityTasks,
      recentDeadlines,
      recentWorkspaces,
      activities,
    ] = await Promise.all([
      this.dashboardStatsService.getStats(input.userId, range),
      this.dashboardTasksService.getPriorityTasks(input.userId, range, limit),
      this.dashboardTasksService.getRecentDeadlines(input.userId, range, 3),
      this.dashboardWorkspacesService.getRecentWorkspaces(input.userId, 3),
      this.dashboardActivityService.getRecentActivities(input.userId, 5),
    ]);

    const suggestions = await this.dashboardSuggestionsService.getSuggestions(
      input.userId,
      range,
      stats,
    );

    const targetThisWeek = stats.completedThisWeek + stats.remainingThisWeek;
    const weeklyGoalPercent = this.getPercent(
      stats.completedThisWeek,
      targetThisWeek,
    );
    const dayProgressPercent = this.getPercent(
      stats.completedToday,
      stats.completedToday + stats.todayTasks,
    );

    return {
      greeting: {
        displayName: input.username,
        todayPriorityCount: stats.todayTasks,
        date: this.formatDateKey(date),
        timezone,
      },
      focus: this.buildFocus({
        stats,
        range,
        targetThisWeek,
        dayProgressPercent,
        weeklyGoalPercent,
      }),
      rhythmBlocks: this.dashboardTasksService.buildRhythmBlocks(priorityTasks),
      recentDeadlines,
      stats: this.buildStatsResponse(stats, weeklyGoalPercent),
      priorityTasks,
      recentWorkspaces,
      recentActivities: activities,
      suggestions,
    };
  }

  private buildFocus(input: {
    stats: Awaited<ReturnType<DashboardStatsService['getStats']>>;
    range: DashboardDateRange;
    targetThisWeek: number;
    dayProgressPercent: number;
    weeklyGoalPercent: number;
  }): DashboardFocusResponseDto {
    const {
      stats,
      range,
      targetThisWeek,
      dayProgressPercent,
      weeklyGoalPercent,
    } = input;

    return {
      title: 'Trọng tâm hôm nay',
      message: this.buildFocusMessage(stats.overdue, stats.reviewTaskCount),
      deepWorkMinutes: stats.deepWorkMinutes,
      reviewTaskCount: stats.reviewTaskCount,
      momentumPercent: this.getMomentumPercent({
        completedThisWeek: stats.completedThisWeek,
        remainingThisWeek: stats.remainingThisWeek,
        targetThisWeek,
        weeklyGoalPercent,
        range,
      }),
      dayProgressPercent,
      completedThisWeek: stats.completedThisWeek,
      targetThisWeek,
      remainingTasks: stats.remainingThisWeek,
      overdueTasks: stats.overdue,
    };
  }

  private buildStatsResponse(
    stats: Awaited<ReturnType<DashboardStatsService['getStats']>>,
    weeklyGoalPercent: number,
  ): DashboardStatsResponseDto {
    return {
      myTasks: stats.myTasks,
      priorityToday: stats.todayTasks,
      upcoming: stats.upcoming,
      upcomingWindowDays: 3,
      overdue: stats.overdue,
      completedThisWeek: stats.completedThisWeek,
      weeklyGoalPercent,
    };
  }

  private buildFocusMessage(overdue: number, reviewTaskCount: number): string {
    if (overdue > 0 && reviewTaskCount > 0) {
      return `Hoàn thành ${overdue} task quá hạn trước, sau đó dành block chiều cho ${reviewTaskCount} task review.`;
    }

    if (overdue > 0) {
      return `Ưu tiên xử lý ${overdue} task quá hạn trước khi mở thêm việc mới.`;
    }

    if (reviewTaskCount > 0) {
      return `Dành một block tập trung để review ${reviewTaskCount} task đang chờ kiểm tra.`;
    }

    return 'Chọn các task quan trọng nhất và giữ nhịp làm việc ổn định trong hôm nay.';
  }

  private buildDateRange(date: Date): DashboardDateRange {
    const now = new Date();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const weekStart = new Date(dayStart);
    const day = weekStart.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + mondayOffset);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const upcomingEnd = new Date(dayStart);
    upcomingEnd.setDate(upcomingEnd.getDate() + 3);

    return {
      now,
      dayStart,
      dayEnd,
      weekStart,
      weekEnd,
      upcomingEnd,
    };
  }

  private resolveDate(date?: string): Date {
    if (!date) return new Date();

    const dateKey = date.slice(0, 10);
    const [year, month, day] = dateKey.split('-').map(Number);

    if (!year || !month || !day) return new Date();

    return new Date(year, month - 1, day);
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getPercent(value: number, total: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
      return 0;
    }

    return Math.round((value / total) * 100);
  }

  private getMomentumPercent(input: {
    completedThisWeek: number;
    remainingThisWeek: number;
    targetThisWeek: number;
    weeklyGoalPercent: number;
    range: DashboardDateRange;
  }): number | null {
    const {
      completedThisWeek,
      remainingThisWeek,
      targetThisWeek,
      weeklyGoalPercent,
      range,
    } = input;

    if (targetThisWeek <= 0) return null;
    if (completedThisWeek + remainingThisWeek <= 0) return null;

    const elapsedWeekRatio = this.getElapsedRatio(
      range.now,
      range.weekStart,
      range.weekEnd,
    );
    const expectedWeekProgressPercent = Math.round(elapsedWeekRatio * 100);

    return weeklyGoalPercent - expectedWeekProgressPercent;
  }

  private getElapsedRatio(now: Date, start: Date, end: Date): number {
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return 0;

    const elapsedMs = now.getTime() - start.getTime();
    return Math.min(Math.max(elapsedMs / totalMs, 0), 1);
  }
}
