import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { EntityManager, Repository } from 'typeorm';
import {
  WorkspaceGrowthPeriod,
  WorkspaceGrowthQueryDto,
} from '../../dto/query/dashboard/workspace-growth-query.dto';
import { WorkspaceGrowthResponseDto } from '../../dto/response/dashboard/workspace-growth.response.dto';
import { AdminWorkspaceGrowthRepository } from '../../interfaces/repositories/dashboard/admin-workspace-growth.repository.interface';

type WorkspaceGrowthRaw = {
  date: string;
  workspaces: string;
};

@Injectable()
export class AdminWorkspaceGrowthRepositoryImpl implements AdminWorkspaceGrowthRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.repo;
  }

  async getWorkspaceGrowth(
    query: WorkspaceGrowthQueryDto,
    manager?: EntityManager,
  ): Promise<WorkspaceGrowthResponseDto[]> {
    try {
      const period = query.period ?? WorkspaceGrowthPeriod.LAST_7_DAYS;

      const now = new Date();
      const startDate = new Date(now);

      if (period === WorkspaceGrowthPeriod.LAST_7_DAYS) {
        startDate.setDate(now.getDate() - 6);
      }

      if (period === WorkspaceGrowthPeriod.LAST_30_DAYS) {
        startDate.setDate(now.getDate() - 29);
      }

      if (period === WorkspaceGrowthPeriod.LAST_60_DAYS) {
        startDate.setDate(now.getDate() - 59);
      }

      if (period === WorkspaceGrowthPeriod.LAST_1_YEAR) {
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setMonth(now.getMonth() + 1);
        startDate.setDate(1);
      }

      startDate.setHours(0, 0, 0, 0);

      const isYearPeriod = period === WorkspaceGrowthPeriod.LAST_1_YEAR;

      const createdAtColumn = `"workspace"."created_at"`;
      const deletedAtColumn = `"workspace"."deleted_at"`;
      const workspaceIdColumn = `"workspace"."id"`;

      const dateExpression = isYearPeriod
        ? `TO_CHAR(${createdAtColumn}, 'YYYY-MM')`
        : `TO_CHAR(${createdAtColumn}, 'YYYY-MM-DD')`;

      const queryBuilder = this.getRepo(manager)
        .createQueryBuilder('workspace')
        .select(dateExpression, 'date')
        .addSelect(`COUNT(${workspaceIdColumn})`, 'workspaces')
        .where(`${createdAtColumn} >= :startDate`, { startDate })
        .andWhere(`${createdAtColumn} <= :now`, { now })
        .andWhere(`${deletedAtColumn} IS NULL`)
        .groupBy(dateExpression)
        .orderBy(dateExpression, 'ASC');

      const rows = await queryBuilder.getRawMany<WorkspaceGrowthRaw>();

      const rowMap = new Map(
        rows.map((row) => [row.date, Number(row.workspaces)]),
      );

      if (isYearPeriod) {
        return this.buildMonthlyResult(startDate, now, rowMap);
      }

      return this.buildDailyResult(startDate, now, rowMap);
    } catch (error) {
      console.error('ADMIN WORKSPACE GROWTH REPOSITORY ERROR:', error);
      throw error;
    }
  }

  private buildDailyResult(
    startDate: Date,
    endDate: Date,
    rowMap: Map<string, number>,
  ): WorkspaceGrowthResponseDto[] {
    const result: WorkspaceGrowthResponseDto[] = [];

    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = this.formatDateKey(cursor);

      result.push({
        date: dateKey,
        name: cursor.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        workspaces: rowMap.get(dateKey) ?? 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private buildMonthlyResult(
    startDate: Date,
    endDate: Date,
    rowMap: Map<string, number>,
  ): WorkspaceGrowthResponseDto[] {
    const result: WorkspaceGrowthResponseDto[] = [];

    const cursor = new Date(startDate);
    cursor.setDate(1);

    const endCursor = new Date(endDate);
    endCursor.setDate(1);

    while (cursor <= endCursor) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, '0');
      const dateKey = `${year}-${month}`;

      result.push({
        date: dateKey,
        name: cursor.toLocaleDateString('en-US', {
          month: 'short',
        }),
        workspaces: rowMap.get(dateKey) ?? 0,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return result;
  }
}
