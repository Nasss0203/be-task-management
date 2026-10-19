import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { MarketplaceCommissionRateReader } from '../../../../application/ports/marketplace-commission-rate-reader.port';
import { DEFAULT_COMMISSION_RATE_BPS } from '../../../../domain/constants/marketplace-commission.constant';
import { MarketplaceCommissionRateOrmEntity } from '../entities/marketplace-commission-rate.orm-entity';

@Injectable()
export class TypeOrmMarketplaceCommissionRateReader implements MarketplaceCommissionRateReader {
  constructor(private readonly dataSource: DataSource) {}

  async getCurrentRateBps(context?: PersistenceContext): Promise<number> {
    const manager =
      context instanceof EntityManager ? context : this.dataSource.manager;

    const latest = await manager
      .getRepository(MarketplaceCommissionRateOrmEntity)
      .findOne({
        where: {},
        order: { createdAt: 'DESC', id: 'DESC' },
      });

    return latest?.rateBps ?? DEFAULT_COMMISSION_RATE_BPS;
  }
}
