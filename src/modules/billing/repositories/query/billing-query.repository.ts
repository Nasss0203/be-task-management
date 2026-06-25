import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { Repository } from 'typeorm';

import { Plan } from '../../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../../domain/entities/subscription-workspace.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { UsageLimit } from '../../domain/entities/usage-limit.entity';
import { type BillingQueryRepository } from '../../interfaces/repositories/query/billing-query.repository.interface';

@Injectable()
export class BillingQueryRepositoryImpl implements BillingQueryRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(SubscriptionWorkspace)
    private readonly subscriptionWorkspaceRepository: Repository<SubscriptionWorkspace>,

    @InjectRepository(UsageLimit)
    private readonly usageLimitRepository: Repository<UsageLimit>,

    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,
  ) {}

  async existsWorkspaceMember(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const member = await this.userWorkspaceRepository.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId,
      },
    });

    return Boolean(member);
  }

  findActiveSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.user_id = :userId', { userId })
      .andWhere('subscription.status = :status', {
        status: SubscriptionStatus.ACTIVE,
      })
      .andWhere(
        '(subscription.current_period_end IS NULL OR subscription.current_period_end > :now)',
        { now: new Date() },
      )
      .orderBy('subscription.created_at', 'DESC')
      .getOne();
  }

  findPlanById(planId: string): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: {
        id: planId,
      },
    });
  }

  findActivePlans(): Promise<Plan[]> {
    return this.planRepository.find({
      where: {
        isActive: true,
      },
      order: {
        sortOrder: 'ASC',
        priceAmount: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  findActivePlanById(planId: string): Promise<Plan | null> {
    return this.planRepository.findOne({
      where: {
        id: planId,
        isActive: true,
      },
    });
  }

  countSubscriptionWorkspaces(subscriptionId: string): Promise<number> {
    return this.subscriptionWorkspaceRepository.count({
      where: {
        subscriptionId,
      },
    });
  }

  findUsageLimitsByWorkspaceId(workspaceId: string): Promise<UsageLimit[]> {
    return this.usageLimitRepository.find({
      where: {
        workspaceId,
      },
      order: {
        resourceType: 'ASC',
      },
    });
  }
}
