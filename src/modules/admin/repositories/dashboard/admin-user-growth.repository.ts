import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import {
  UserGrowthGroupBy,
  UserGrowthPeriod,
  UserGrowthQueryDto,
} from '../../dto/query/dashboard/user-growth-query.dto';
import { UserGrowthResponseDto } from '../../dto/response/dashboard/user-growth.response.dto';
import { AdminUserGrowthRepository } from '../../interfaces/repositories/dashboard/admin-user-growth.repository.interface';

type UserGrowthRaw = {
  date: string;
  users: string;
};

@Injectable()
export class AdminUserGrowthRepositoryImpl implements AdminUserGrowthRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.repo;
  }

  async getUserGrowth(
    query: UserGrowthQueryDto,
    manager?: EntityManager,
  ): Promise<UserGrowthResponseDto[]> {
    try {
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

      const createdAtColumn = `"u"."created_at"`;
      const deletedAtColumn = `"u"."deleted_at"`;
      const userIdColumn = `"u"."id"`;

      const dateExpression =
        groupBy === UserGrowthGroupBy.MONTH
          ? `TO_CHAR(${createdAtColumn}, 'YYYY-MM')`
          : `TO_CHAR(${createdAtColumn}, 'YYYY-MM-DD')`;

      const queryBuilder = this.getRepo(manager)
        .createQueryBuilder('u')
        .select(dateExpression, 'date')
        .addSelect(`COUNT(${userIdColumn})`, 'users')
        .where(`${createdAtColumn} >= :startDate`, { startDate })
        .andWhere(`${createdAtColumn} <= :now`, { now })
        .andWhere(`${deletedAtColumn} IS NULL`)
        .groupBy(dateExpression)
        .orderBy(dateExpression, 'ASC');

      const rows = await queryBuilder.getRawMany<UserGrowthRaw>();

      const rowMap = new Map(rows.map((row) => [row.date, Number(row.users)]));

      if (groupBy === UserGrowthGroupBy.MONTH) {
        return this.buildMonthlyResult(startDate, now, rowMap);
      }

      return this.buildDailyResult(startDate, now, rowMap);
    } catch (error) {
      console.error('ADMIN USER GROWTH REPOSITORY ERROR:', error);
      throw error;
    }
  }

  private buildDailyResult(
    startDate: Date,
    endDate: Date,
    rowMap: Map<string, number>,
  ): UserGrowthResponseDto[] {
    const result: UserGrowthResponseDto[] = [];

    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = this.formatDateKey(cursor);

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
