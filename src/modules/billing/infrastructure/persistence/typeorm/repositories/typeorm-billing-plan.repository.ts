import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, Repository } from 'typeorm';
import { BillingPlan } from '../../../../domain/entities/billing-plan.entity';
import type { BillingPlanRepository } from '../../../../domain/repositories/billing-plan.repository';
import { BillingPlanOrmEntity } from '../entities/billing-plan.orm-entity';
import { BillingPlanMapper } from '../mappers/billing-plan.mapper';

@Injectable()
export class TypeOrmBillingPlanRepository implements BillingPlanRepository {
  constructor(
    @InjectRepository(BillingPlanOrmEntity)
    private readonly repository: Repository<BillingPlanOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<BillingPlanOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(BillingPlanOrmEntity)
      : this.repository;
  }

  async save(
    plan: BillingPlan,
    context?: PersistenceContext,
  ): Promise<BillingPlan> {
    const repository = this.getRepository(context);
    const saved = await repository.save(BillingPlanMapper.toOrm(plan));

    return BillingPlanMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingPlan | null> {
    const entity = await this.getRepository(context).findOne({
      where: { id },
    });

    return entity ? BillingPlanMapper.toDomain(entity) : null;
  }

  async findByCode(
    code: string,
    context?: PersistenceContext,
  ): Promise<BillingPlan | null> {
    const entity = await this.getRepository(context).findOne({
      where: { code },
    });

    return entity ? BillingPlanMapper.toDomain(entity) : null;
  }

  async findActivePublic(context?: PersistenceContext): Promise<BillingPlan[]> {
    const entities = await this.getRepository(context).find({
      where: {
        is_active: true,
        is_public: true,
      },
      order: {
        created_at: 'ASC',
      },
    });

    return entities.map((entity) => BillingPlanMapper.toDomain(entity));
  }
}
