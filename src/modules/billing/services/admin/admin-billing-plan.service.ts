import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdminCreatePlanDto } from '../../dto/request/admin-create-plan.dto';
import { AdminUpdatePlanStatusDto } from '../../dto/request/admin-update-plan-status.dto';
import { AdminUpdatePlanDto } from '../../dto/request/admin-update-plan.dto';
import {
  Plan,
  PlanBillingInterval,
} from '../../domain/entities/plan.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../../domain/entities/subscription.entity';

export type AdminBillingPlanRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  monthlyAmount: number;
  estimatedMrr: number;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  isActive: boolean;
  activeSubscriptions: number;
  createdAt: Date;
  updatedAt: Date;
};

type PlanRawRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceAmount: number;
  currency: string;
  billingInterval: string;
  features: Record<string, unknown> | null;
  limits: Record<string, unknown> | null;
  isActive: boolean;
  activeSubscriptions: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AdminBillingPlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async getPlans(): Promise<AdminBillingPlanRow[]> {
    const rows = await this.createAdminPlanQuery()
      .orderBy('plan.sortOrder', 'ASC')
      .addOrderBy('plan.createdAt', 'DESC')
      .getRawMany<PlanRawRow>();

    return rows.map((row) => this.toAdminPlanRow(row));
  }

  async createPlan(dto: AdminCreatePlanDto): Promise<AdminBillingPlanRow> {
    await this.assertSlugAvailable(dto.slug);

    const plan = this.planRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      priceAmount: dto.priceAmount,
      currency: dto.currency ?? 'VND',
      billingInterval: dto.billingInterval,
      features: dto.features ?? null,
      limits: dto.limits ?? null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    const savedPlan = await this.planRepository.save(plan);

    return this.getPlanResponseById(savedPlan.id);
  }

  async updatePlan(
    planId: string,
    dto: AdminUpdatePlanDto,
  ): Promise<AdminBillingPlanRow> {
    const plan = await this.findPlanOrFail(planId);

    if (dto.slug !== undefined && dto.slug !== plan.slug) {
      await this.assertSlugAvailable(dto.slug, planId);
      plan.slug = dto.slug;
    }

    if (dto.name !== undefined) {
      plan.name = dto.name;
    }

    if (dto.description !== undefined) {
      plan.description = dto.description;
    }

    if (dto.priceAmount !== undefined) {
      plan.priceAmount = dto.priceAmount;
    }

    if (dto.currency !== undefined) {
      plan.currency = dto.currency;
    }

    if (dto.billingInterval !== undefined) {
      plan.billingInterval = dto.billingInterval;
    }

    if (dto.features !== undefined) {
      plan.features = dto.features;
    }

    if (dto.limits !== undefined) {
      plan.limits = dto.limits;
    }

    if (dto.isActive !== undefined) {
      plan.isActive = dto.isActive;
    }

    if (dto.sortOrder !== undefined) {
      plan.sortOrder = dto.sortOrder;
    }

    const savedPlan = await this.planRepository.save(plan);

    return this.getPlanResponseById(savedPlan.id);
  }

  async updatePlanStatus(
    planId: string,
    dto: AdminUpdatePlanStatusDto,
  ): Promise<AdminBillingPlanRow> {
    const plan = await this.findPlanOrFail(planId);
    plan.isActive = dto.isActive;

    const savedPlan = await this.planRepository.save(plan);

    return this.getPlanResponseById(savedPlan.id);
  }

  private async findPlanOrFail(planId: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  private async assertSlugAvailable(
    slug: string,
    currentPlanId?: string,
  ): Promise<void> {
    const existingPlan = await this.planRepository.findOne({
      where: { slug },
      withDeleted: true,
    });

    if (existingPlan && existingPlan.id !== currentPlanId) {
      throw new ConflictException('Plan slug already exists');
    }
  }

  private async getPlanResponseById(planId: string): Promise<AdminBillingPlanRow> {
    const row = await this.createAdminPlanQuery()
      .andWhere('plan.id = :planId', { planId })
      .getRawOne<PlanRawRow>();

    if (!row) {
      throw new NotFoundException('Plan not found');
    }

    return this.toAdminPlanRow(row);
  }

  private createAdminPlanQuery() {
    return this.planRepository
      .createQueryBuilder('plan')
      .select('plan.id', 'id')
      .addSelect('plan.name', 'name')
      .addSelect('plan.slug', 'slug')
      .addSelect('plan.description', 'description')
      .addSelect('plan.priceAmount', 'priceAmount')
      .addSelect('plan.currency', 'currency')
      .addSelect('plan.billingInterval', 'billingInterval')
      .addSelect('plan.features', 'features')
      .addSelect('plan.limits', 'limits')
      .addSelect('plan.isActive', 'isActive')
      .addSelect('plan.createdAt', 'createdAt')
      .addSelect('plan.updatedAt', 'updatedAt')
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(subscription.id)', 'count')
            .from(Subscription, 'subscription')
            .where('subscription.plan_id = plan.id')
            .andWhere('subscription.status = :status'),
        'activeSubscriptions',
      )
      .setParameter('status', SubscriptionStatus.ACTIVE);
  }

  private toAdminPlanRow(row: PlanRawRow): AdminBillingPlanRow {
    const monthlyAmount = this.calculateMonthlyAmount(
      row.priceAmount,
      row.billingInterval,
    );
    const activeSubscriptions = Number(row.activeSubscriptions);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      priceAmount: row.priceAmount,
      currency: row.currency,
      billingInterval: row.billingInterval,
      features: row.features,
      limits: row.limits,
      isActive: row.isActive,
      activeSubscriptions,
      monthlyAmount,
      estimatedMrr: monthlyAmount * activeSubscriptions,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private calculateMonthlyAmount(
    amount: number,
    billingInterval: string,
  ): number {
    if (billingInterval === PlanBillingInterval.MONTH) {
      return amount;
    }

    if (billingInterval === PlanBillingInterval.YEAR) {
      return Math.round(amount / 12);
    }

    return 0;
  }
}
