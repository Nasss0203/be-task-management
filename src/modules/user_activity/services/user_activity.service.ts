import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserActivity,
  UserActivityType,
} from '../domain/entities/user_activity.entity';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async record(
    userId: string,
    type: UserActivityType = UserActivityType.OPEN_APP,
  ): Promise<void> {
    await this.userActivityRepository.insert({
      userId,
      type,
    });
  }

  async recordLogin(userId: string): Promise<void> {
    await this.record(userId, UserActivityType.LOGIN);
  }

  async recordOpenApp(userId: string): Promise<void> {
    await this.record(userId, UserActivityType.OPEN_APP);
  }

  async recordOpenWorkspace(userId: string): Promise<void> {
    await this.record(userId, UserActivityType.OPEN_WORKSPACE);
  }
}
