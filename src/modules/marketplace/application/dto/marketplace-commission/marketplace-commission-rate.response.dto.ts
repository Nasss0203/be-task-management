import { MarketplaceCommissionRate } from '../../../domain/entities/marketplace-commission-rate.entity';

export class MarketplaceCommissionRateResponseDto {
  id: string;

  rateBps: number;

  createdBy: string;

  createdAt: Date;

  static fromDomain(
    rate: MarketplaceCommissionRate,
  ): MarketplaceCommissionRateResponseDto {
    const dto = new MarketplaceCommissionRateResponseDto();

    dto.id = rate.getId();
    dto.rateBps = rate.getRateBps();
    dto.createdBy = rate.getCreatedBy();
    dto.createdAt = rate.getCreatedAt();

    return dto;
  }
}

export class MarketplaceCommissionSettingsResponseDto {
  rateBps: number;

  history: MarketplaceCommissionRateResponseDto[];
}
