import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { MarketplaceCommissionRate } from '../../../../domain/entities/marketplace-commission-rate.entity';
import type { MarketplaceCommissionRateRepository } from '../../../../domain/repositories/marketplace-commission-rate.repository';
import { MarketplaceCommissionRateResponseDto } from '../../../dto/marketplace-commission/marketplace-commission-rate.response.dto';

import { UpdateMarketplaceCommissionRateCommand } from './update-marketplace-commission-rate.command';

@Injectable()
export class UpdateMarketplaceCommissionRateHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.MarketplaceCommissionRateRepository)
    private readonly commissionRateRepository: MarketplaceCommissionRateRepository,
  ) {}

  async execute(
    command: UpdateMarketplaceCommissionRateCommand,
  ): Promise<MarketplaceCommissionRateResponseDto> {
    let rate: MarketplaceCommissionRate;

    try {
      rate = MarketplaceCommissionRate.create({
        rateBps: command.rateBps,
        createdBy: command.actorId,
      });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const saved = await this.commissionRateRepository.create(rate);

    return MarketplaceCommissionRateResponseDto.fromDomain(saved);
  }
}
