import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserActivity } from 'src/modules/user_activity/domain/entities/user_activity.entity';
import { EntityManager, Repository } from 'typeorm';
import {
  UserGrowthGroupBy,
  UserGrowthPeriod,
  UserGrowthQueryDto,
} from '../dto/query/user-growth-query.dto';
import { UserGrowthResponseDto } from '../dto/response/user-growth.response.dto';
import { AdminUserGrowthRepository } from '../interfaces/repositories/admin-user-growth.repository.interface';

type UserGrowthRaw = {
  date: string;
  users: string;
};

@Injectable()
export class AdminUserGrowthRepositoryImpl implements AdminUserGrowthRepository {
  constructor(
    @InjectRepository(UserActivity)
    private readonly repo: Repository<UserActivity>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<UserActivity> {
    return manager ? manager.getRepository(UserActivity) : this.repo;
  }

  async getUserGrowth(
    query: UserGrowthQueryDto,
    manager?: EntityManager,
  ): Promise<UserGrowthResponseDto[]> {
    const period = query.period ?? UserGrowthPeriod.LAST_7_DAYS;

    const groupBy =
      query.groupBy ??
      (period === UserGrowthPeriod.LAST_1_YEAR
        ? UserGrowthGroupBy.MONTH
        : UserGrowthGroupBy.DAY);

    const now = new Date();
    const startDate = new Date(now);

    if (period === UserGrowthPeriod.LAST_7_DAYS) {
      startDate.setDate(now.getDate() - 6);
    }

    if (period === UserGrowthPeriod.LAST_30_DAYS) {
      startDate.setDate(now.getDate() - 29);
    }

    if (period === UserGrowthPeriod.LAST_60_DAYS) {
      startDate.setDate(now.getDate() - 59);
    }

    if (period === UserGrowthPeriod.LAST_1_YEAR) {
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setMonth(now.getMonth() + 1);
      startDate.setDate(1);
    }

    startDate.setHours(0, 0, 0, 0);

    const dateExpression =
      groupBy === UserGrowthGroupBy.MONTH
        ? `TO_CHAR(activity.createdAt, 'YYYY-MM')`
        : `TO_CHAR(activity.createdAt, 'YYYY-MM-DD')`;

    const rows = await this.getRepo(manager)
      .createQueryBuilder('activity')
      .select(dateExpression, 'date')
      .addSelect('COUNT(DISTINCT activity.userId)', 'users')
      .where('activity.createdAt >= :startDate', { startDate })
      .andWhere('activity.createdAt <= :now', { now })
      .groupBy(dateExpression)
      .orderBy(dateExpression, 'ASC')
      .getRawMany<UserGrowthRaw>();

    const rowMap = new Map(rows.map((row) => [row.date, Number(row.users)]));

    if (groupBy === UserGrowthGroupBy.MONTH) {
      return this.buildMonthlyResult(startDate, now, rowMap);
    }

    return this.buildDailyResult(startDate, now, rowMap);
  }

  private buildDailyResult(
    startDate: Date,
    endDate: Date,
    rowMap: Map<string, number>,
  ): UserGrowthResponseDto[] {
    const result: UserGrowthResponseDto[] = [];

    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = cursor.toISOString().slice(0, 10);

      result.push({
        date: dateKey,
        name: cursor.toLocaleDateString('en-US', {
          weekday: 'short',
        }),
        users: rowMap.get(dateKey) ?? 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  private buildMonthlyResult(
    startDate: Date,
    endDate: Date,
    rowMap: Map<string, number>,
  ): UserGrowthResponseDto[] {
    const result: UserGrowthResponseDto[] = [];

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
        users: rowMap.get(dateKey) ?? 0,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return result;
  }
}
