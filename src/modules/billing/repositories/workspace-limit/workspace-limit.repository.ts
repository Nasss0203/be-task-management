import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { EntityManager, Repository } from 'typeorm';

import { Plan } from '../../domain/entities/plan.entity';
import { SubscriptionWorkspace } from '../../domain/entities/subscription-workspace.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';
import { UsageLimit } from '../../domain/entities/usage-limit.entity';
import { type WorkspaceLimitRepository } from '../../interfaces/repositories/workspace-limit/workspace-limit.repository.interface';

@Injectable()
export class WorkspaceLimitRepositoryImpl implements WorkspaceLimitRepository {
  constructor(
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,

    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(SubscriptionWorkspace)
    private readonly subscriptionWorkspaceRepository: Repository<SubscriptionWorkspace>,

    @InjectRepository(UsageLimit)
    private readonly usageLimitRepository: Repository<UsageLimit>,
  ) {}

  countActiveWorkspacesByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const userWorkspaceRepository =
      manager?.getRepository(UserWorkspace) ?? this.userWorkspaceRepository;

    return userWorkspaceRepository
      .createQueryBuilder('uw')
      .innerJoin(Workspace, 'w', 'w.id = uw.workspace_id')
      .where('uw.user_id = :userId', { userId })
      .andWhere('w.deleted_at IS NULL')
      .getCount();
  }

  findActiveSubscription(
    userId: string,
    manager?: EntityManager,
  ): Promise<Subscription | null> {
    return this.getSubscriptionRepository(manager).findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  findActivePlanById(
    planId: string,
    manager?: EntityManager,
  ): Promise<Plan | null> {
    return this.getPlanRepository(manager).findOne({
      where: {
        id: planId,
        isActive: true,
      },
    });
  }

  findActivePlanBySlug(
    slug: string,
    manager?: EntityManager,
  ): Promise<Plan | null> {
    return this.getPlanRepository(manager).findOne({
      where: {
        slug,
        isActive: true,
      },
    });
  }

  countSubscriptionWorkspaces(
    subscriptionId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.getSubscriptionWorkspaceRepository(manager).count({
      where: {
        subscriptionId,
      },
    });
  }

  findSubscriptionWorkspaceByWorkspaceId(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<SubscriptionWorkspace | null> {
    return this.getSubscriptionWorkspaceRepository(manager).findOne({
      where: {
        workspaceId,
      },
    });
  }

  createSubscriptionWorkspace(input: {
    subscriptionId: string;
    workspaceId: string;
  }): SubscriptionWorkspace {
    return this.subscriptionWorkspaceRepository.create({
      subscriptionId: input.subscriptionId,
      workspaceId: input.workspaceId,
      activatedAt: new Date(),
    });
  }

  saveSubscriptionWorkspace(
    subscriptionWorkspace: SubscriptionWorkspace,
    manager?: EntityManager,
  ): Promise<SubscriptionWorkspace> {
    return this.getSubscriptionWorkspaceRepository(manager).save(
      subscriptionWorkspace,
    );
  }

  findUsageLimit(
    workspaceId: string,
    resourceType: UsageLimit['resourceType'],
    manager?: EntityManager,
  ): Promise<UsageLimit | null> {
    return this.getUsageLimitRepository(manager).findOne({
      where: {
        workspaceId,
        resourceType,
      },
    });
  }

  createUsageLimit(input: Partial<UsageLimit>): UsageLimit {
    return this.usageLimitRepository.create(input);
  }

  saveUsageLimit(
    usageLimit: UsageLimit,
    manager?: EntityManager,
  ): Promise<UsageLimit> {
    return this.getUsageLimitRepository(manager).save(usageLimit);
  }

  private getSubscriptionRepository(
    manager?: EntityManager,
  ): Repository<Subscription> {
    return manager?.getRepository(Subscription) ?? this.subscriptionRepository;
  }

  private getPlanRepository(manager?: EntityManager): Repository<Plan> {
    return manager?.getRepository(Plan) ?? this.planRepository;
  }

  private getSubscriptionWorkspaceRepository(
    manager?: EntityManager,
  ): Repository<SubscriptionWorkspace> {
    return (
      manager?.getRepository(SubscriptionWorkspace) ??
      this.subscriptionWorkspaceRepository
    );
  }

  private getUsageLimitRepository(
    manager?: EntityManager,
  ): Repository<UsageLimit> {
    return manager?.getRepository(UsageLimit) ?? this.usageLimitRepository;
  }
}
