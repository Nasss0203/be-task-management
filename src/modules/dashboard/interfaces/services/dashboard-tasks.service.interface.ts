import {
  DashboardDeadlineResponseDto,
  DashboardRhythmBlockResponseDto,
  DashboardTaskResponseDto,
} from '../../dto/response/my-dashboard.response.dto';
import { DashboardDateRange } from '../repositories/dashboard.repository.interface';

export interface DashboardTasksService {
  getPriorityTasks(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardTaskResponseDto[]>;

  getRecentDeadlines(
    userId: string,
    range: DashboardDateRange,
    limit: number,
  ): Promise<DashboardDeadlineResponseDto[]>;

  buildRhythmBlocks(
    tasks: DashboardTaskResponseDto[],
  ): DashboardRhythmBlockResponseDto[];

  getRecentCompletedTasks(
    userId: string,
    limit: number,
  ): Promise<DashboardTaskResponseDto[]>;
}
