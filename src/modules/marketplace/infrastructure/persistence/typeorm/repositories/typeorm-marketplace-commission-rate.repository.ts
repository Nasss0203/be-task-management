import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { EntityManager, Repository } from 'typeorm';

import { MarketplaceCommissionRate } from '../../../../domain/entities/marketplace-commission-rate.entity';
import type { MarketplaceCommissionRateRepository } from '../../../../domain/repositories/marketplace-commission-rate.repository';
import { MarketplaceCommissionRateOrmEntity } from '../entities/marketplace-commission-rate.orm-entity';
import { MarketplaceCommissionRateMapper } from '../mappers/marketplace-commission-rate.mapper';

@Injectable()
export class TypeOrmMarketplaceCommissionRateRepository implements MarketplaceCommissionRateRepository {
  constructor(
    @InjectRepository(MarketplaceCommissionRateOrmEntity)
    private readonly repository: Repository<MarketplaceCommissionRateOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<MarketplaceCommissionRateOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(
          MarketplaceCommissionRateOrmEntity,
        )
      : this.repository;
  }

  async create(
    rate: MarketplaceCommissionRate,
    context?: PersistenceContext,
  ): Promise<MarketplaceCommissionRate> {
    const saved = await this.getRepository(context).save(
      MarketplaceCommissionRateMapper.toOrm(rate),
    );

    return MarketplaceCommissionRateMapper.toDomain(saved);
  }

  async findRecent(
    limit: number,
    context?: PersistenceContext,
  ): Promise<MarketplaceCommissionRate[]> {
    const entities = await this.getRepository(context).find({
      order: { createdAt: 'DESC', id: 'DESC' },
      take: limit,
    });

    return entities.map((entity) =>
      MarketplaceCommissionRateMapper.toDomain(entity),
    );
  }
}
