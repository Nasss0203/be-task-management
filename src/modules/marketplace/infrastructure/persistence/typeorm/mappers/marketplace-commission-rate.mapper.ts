import { MarketplaceCommissionRate } from '../../../../domain/entities/marketplace-commission-rate.entity';
import { MarketplaceCommissionRateOrmEntity } from '../entities/marketplace-commission-rate.orm-entity';

export class MarketplaceCommissionRateMapper {
  static toDomain(
    entity: MarketplaceCommissionRateOrmEntity,
  ): MarketplaceCommissionRate {
    return MarketplaceCommissionRate.reconstitute({
      id: entity.id,
      rateBps: entity.rateBps,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
    });
  }

  static toOrm(
    domain: MarketplaceCommissionRate,
  ): MarketplaceCommissionRateOrmEntity {
    const entity = new MarketplaceCommissionRateOrmEntity();

    entity.id = domain.getId();
    entity.rateBps = domain.getRateBps();
    entity.createdBy = domain.getCreatedBy();
    entity.createdAt = domain.getCreatedAt();

    return entity;
  }
}
