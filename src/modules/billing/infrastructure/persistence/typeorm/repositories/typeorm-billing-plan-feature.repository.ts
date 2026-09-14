import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, In, Repository } from 'typeorm';
import { BillingPlanFeature } from '../../../../domain/entities/billing-plan-feature.entity';
import type { BillingPlanFeatureRepository } from '../../../../domain/repositories/billing-plan-feature.repository';
import { BillingPlanFeatureOrmEntity } from '../entities/billing-plan-feature.orm-entity';
import { BillingPlanFeatureMapper } from '../mappers/billing-plan-feature.mapper';

@Injectable()
export class TypeOrmBillingPlanFeatureRepository implements BillingPlanFeatureRepository {
  constructor(
    @InjectRepository(BillingPlanFeatureOrmEntity)
    private readonly repository: Repository<BillingPlanFeatureOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<BillingPlanFeatureOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(BillingPlanFeatureOrmEntity)
      : this.repository;
  }

  async save(
    planFeature: BillingPlanFeature,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature> {
    const repository = this.getRepository(context);
    const saved = await repository.save(
      BillingPlanFeatureMapper.toOrm(planFeature),
    );

    return BillingPlanFeatureMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature | null> {
    const entity = await this.getRepository(context).findOne({
      where: { id },
    });

    return entity ? BillingPlanFeatureMapper.toDomain(entity) : null;
  }

  async findByPlanId(
    planId: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature[]> {
    const entities = await this.getRepository(context).find({
      where: {
        plan_id: planId,
      },
      order: {
        created_at: 'ASC',
      },
    });

    return entities.map((entity) => BillingPlanFeatureMapper.toDomain(entity));
  }

  async findByPlanIds(
    planIds: readonly string[],
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature[]> {
    if (planIds.length === 0) {
      return [];
    }

    const entities = await this.getRepository(context).find({
      where: {
        plan_id: In([...planIds]),
      },
      order: {
        created_at: 'ASC',
      },
    });

    return entities.map((entity) => BillingPlanFeatureMapper.toDomain(entity));
  }

  async findByPlanIdAndFeatureId(
    planId: string,
    featureId: string,
    context?: PersistenceContext,
  ): Promise<BillingPlanFeature | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        plan_id: planId,
        feature_id: featureId,
      },
    });

    return entity ? BillingPlanFeatureMapper.toDomain(entity) : null;
  }
}
