import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserActivity } from 'src/modules/user_activity/domain/entities/user_activity.entity';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';
import { Repository } from 'typeorm';
import { AdminUserOverviewResponseDto } from '../../dto/response/user/admin-user-overview.response.dto';
import { AdminUserOverviewRepository } from '../../interfaces/repositories/user/admin-user-overview.repository.interface';

type CountRaw = {
  count: string;
};

@Injectable()
export class AdminUserOverviewRepositoryImpl implements AdminUserOverviewRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async getOverview(): Promise<AdminUserOverviewResponseDto> {
    const now = new Date();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      lockedUsers,
      systemAdmins,
      newUsersLast7Days,
      activeToday,
    ] = await Promise.all([
      this.countTotalUsers(),
      this.countActiveUsers(),
      this.countLockedUsers(),
      this.countSystemAdmins(),
      this.countNewUsersLast7Days(sevenDaysAgo),
      this.countActiveToday(startOfToday),
    ]);

    return {
      totalUsers,
      activeUsers,
      lockedUsers,
      systemAdmins,
      newUsersLast7Days,
      activeToday,
    };
  }

  private async countTotalUsers(): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT("u"."id")', 'count')
      .where('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countActiveUsers(): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT("u"."id")', 'count')
      .where('"u"."is_active" = true')
      .andWhere('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countLockedUsers(): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT("u"."id")', 'count')
      .where('"u"."is_active" = false')
      .andWhere('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countSystemAdmins(): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT("u"."id")', 'count')
      .where('"u"."system_role" IN (:...roles)', {
        roles: [SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN],
      })
      .andWhere('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countNewUsersLast7Days(sevenDaysAgo: Date): Promise<number> {
    const raw = await this.userRepository
      .createQueryBuilder('u')
      .select('COUNT("u"."id")', 'count')
      .where('"u"."created_at" >= :sevenDaysAgo', { sevenDaysAgo })
      .andWhere('"u"."deleted_at" IS NULL')
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }

  private async countActiveToday(startOfToday: Date): Promise<number> {
    const raw = await this.userActivityRepository
      .createQueryBuilder('activity')
      .select('COUNT(DISTINCT "activity"."user_id")', 'count')
      .where('"activity"."created_at" >= :startOfToday', { startOfToday })
      .getRawOne<CountRaw>();

    return Number(raw?.count ?? 0);
  }
}
