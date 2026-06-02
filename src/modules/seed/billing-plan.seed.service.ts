import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DEFAULT_PLAN_LIMITS,
  FREE_PLAN_SLUG,
  PRO_PLAN_SLUG,
} from '../billing/constants/default-plan-limits.constant';
import {
  Plan,
  PlanBillingInterval,
} from '../billing/domain/entities/plan.entity';
import { FeatureKey } from '../features/constants/feature-key.constant';

type BillingPlanSeedItem = {
  name: string;
  slug: string;
  description: string;
  priceAmount: number;
  currency: string;
  billingInterval: PlanBillingInterval;
  features: Record<string, unknown>;
  limits: Record<string, number | null>;
  isActive: boolean;
  sortOrder: number;
};

enum PlanName {
  FREE = 'FREE',
  PRO = 'PRO',
}

const BILLING_PLAN_SEED_DATA: BillingPlanSeedItem[] = [
  {
    name: PlanName.FREE,
    slug: FREE_PLAN_SLUG,
    description: 'Basic plan for getting started.',
    priceAmount: 0,
    currency: 'VND',
    billingInterval: PlanBillingInterval.MONTH,
    features: {
      kanban: true,
      [FeatureKey.SPRINT_ENABLED]: true,
      storage: true,
      pageTemplates: true,
    },
    limits: DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG],
    isActive: true,
    sortOrder: 1,
  },
  {
    name: PlanName.PRO,
    slug: PRO_PLAN_SLUG,
    description: 'Monthly pro plan for growing workspaces.',
    priceAmount: 99000,
    currency: 'VND',
    billingInterval: PlanBillingInterval.MONTH,
    features: {
      kanban: true,
      [FeatureKey.SPRINT_ENABLED]: true,
      storage: true,
      pageTemplates: true,
      upgradedWorkspaces: true,
    },
    limits: DEFAULT_PLAN_LIMITS[PRO_PLAN_SLUG],
    isActive: true,
    sortOrder: 2,
  },
];

@Injectable()
export class BillingPlanSeedService {
  private readonly logger = new Logger(BillingPlanSeedService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async seedPlans(): Promise<void> {
    for (const item of BILLING_PLAN_SEED_DATA) {
      const existed = await this.planRepository.findOne({
        where: { slug: item.slug },
        withDeleted: true,
      });

      if (existed) {
        await this.planRepository.save({
          ...existed,
          ...item,
          deletedAt: null,
        });
        this.logger.log(`Updated billing plan: ${item.slug}`);
        continue;
      }

      const plan = this.planRepository.create(item);

      await this.planRepository.save(plan);
      this.logger.log(`Seeded billing plan: ${item.slug}`);
    }
  }

  async seed(): Promise<void> {
    await this.seedPlans();
    this.logger.log('Billing plan seed completed');
  }
}
