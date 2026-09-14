import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, Repository } from 'typeorm';
import { BillingFeature } from '../../../../domain/entities/billing-feature.entity';
import type { BillingFeatureRepository } from '../../../../domain/repositories/billing-feature.repository';
import { BillingFeatureOrmEntity } from '../entities/billing-feature.orm-entity';
import { BillingFeatureMapper } from '../mappers/billing-feature.mapper';

@Injectable()
export class TypeOrmBillingFeatureRepository implements BillingFeatureRepository {
  constructor(
    @InjectRepository(BillingFeatureOrmEntity)
    private readonly repository: Repository<BillingFeatureOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<BillingFeatureOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(BillingFeatureOrmEntity)
      : this.repository;
  }

  async save(
    feature: BillingFeature,
    context?: PersistenceContext,
  ): Promise<BillingFeature> {
    const repository = this.getRepository(context);
    const saved = await repository.save(BillingFeatureMapper.toOrm(feature));

    return BillingFeatureMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<BillingFeature | null> {
    const entity = await this.getRepository(context).findOne({
      where: { id },
    });

    return entity ? BillingFeatureMapper.toDomain(entity) : null;
  }

  async findByCode(
    code: string,
    context?: PersistenceContext,
  ): Promise<BillingFeature | null> {
    const entity = await this.getRepository(context).findOne({
      where: { code },
    });

    return entity ? BillingFeatureMapper.toDomain(entity) : null;
  }

  async findAll(context?: PersistenceContext): Promise<BillingFeature[]> {
    const entities = await this.getRepository(context).find({
      order: {
        code: 'ASC',
      },
    });

    return entities.map((entity) => BillingFeatureMapper.toDomain(entity));
  }
}
