import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, In, Repository } from 'typeorm';
import { BillingProvider } from '../../../../domain/constants/billing-provider.constant';
import { BillingPlanPrice } from '../../../../domain/entities/billing-plan-price.entity';
import type { BillingPlanPriceRepository } from '../../../../domain/repositories/billing-plan-price.repository';
import { BillingPlanPriceOrmEntity } from '../entities/billing-plan-price.orm-entity';
import { BillingPlanPriceMapper } from '../mappers/billing-plan-price.mapper';

@Injectable()
export class TypeOrmBillingPlanPriceRepository implements BillingPlanPriceRepository {
  constructor(
    @InjectRepository(BillingPlanPriceOrmEntity)
    private readonly repository: Repository<BillingPlanPriceOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<BillingPlanPriceOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(BillingPlanPriceOrmEntity)
      : this.repository;
  }

  async save(
    planPrice: BillingPlanPrice,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice> {
    const repository = this.getRepository(context);
    const saved = await repository.save(
      BillingPlanPriceMapper.toOrm(planPrice),
    );

    return BillingPlanPriceMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice | null> {
    const entity = await this.getRepository(context).findOne({
      where: { id },
    });

    return entity ? BillingPlanPriceMapper.toDomain(entity) : null;
  }

  async findActiveById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        id,
        is_active: true,
      },
    });

    return entity ? BillingPlanPriceMapper.toDomain(entity) : null;
  }

  async findActiveByPlanId(
    planId: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice[]> {
    const entities = await this.getRepository(context).find({
      where: {
        plan_id: planId,
        is_active: true,
      },
      order: {
        amount: 'ASC',
      },
    });

    return entities.map((entity) => BillingPlanPriceMapper.toDomain(entity));
  }

  async findActiveByPlanIds(
    planIds: readonly string[],
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice[]> {
    if (planIds.length === 0) {
      return [];
    }

    const entities = await this.getRepository(context).find({
      where: {
        plan_id: In([...planIds]),
        is_active: true,
      },
      order: {
        plan_id: 'ASC',
        amount: 'ASC',
      },
    });

    return entities.map((entity) => BillingPlanPriceMapper.toDomain(entity));
  }

  async findActiveByPlanIdAndProvider(
    planId: string,
    provider: BillingProvider,
    context?: PersistenceContext,
  ): Promise<BillingPlanPrice[]> {
    const entities = await this.getRepository(context).find({
      where: {
        plan_id: planId,
        provider,
        is_active: true,
      },
      order: {
        amount: 'ASC',
      },
    });

    return entities.map((entity) => BillingPlanPriceMapper.toDomain(entity));
  }
}
