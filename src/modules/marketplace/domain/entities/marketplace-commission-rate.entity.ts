import { randomUUID } from 'node:crypto';

import { MAX_COMMISSION_RATE_BPS } from '../constants/marketplace-commission.constant';

export interface CreateMarketplaceCommissionRateParams {
  id?: string;
  rateBps: number;
  createdBy: string;
  createdAt?: Date;
}

export interface ReconstituteMarketplaceCommissionRateParams {
  id: string;
  rateBps: number;
  createdBy: string;
  createdAt: Date;
}

export class MarketplaceCommissionRate {
  private constructor(
    private readonly id: string,
    private readonly rateBps: number,
    private readonly createdBy: string,
    private readonly createdAt: Date,
  ) {}

  static create(
    params: CreateMarketplaceCommissionRateParams,
  ): MarketplaceCommissionRate {
    const createdBy = params.createdBy?.trim();

    if (!createdBy) {
      throw new Error('Commission rate creator is required');
    }

    if (
      !Number.isInteger(params.rateBps) ||
      params.rateBps < 0 ||
      params.rateBps > MAX_COMMISSION_RATE_BPS
    ) {
      throw new Error('Invalid commission rate');
    }

    return new MarketplaceCommissionRate(
      params.id ?? randomUUID(),
      params.rateBps,
      createdBy,
      params.createdAt ?? new Date(),
    );
  }

  static reconstitute(
    params: ReconstituteMarketplaceCommissionRateParams,
  ): MarketplaceCommissionRate {
    return new MarketplaceCommissionRate(
      params.id,
      params.rateBps,
      params.createdBy,
      params.createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getRateBps(): number {
    return this.rateBps;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
