import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';
import { CreateTemplatePurchaseResponseDto } from '../../../dto/template-purchase/create-template-purchase.response.dto';
import { GetTemplatePurchaseQuery } from './get-template-purchase.query';

/** Read-only: a buyer reads the status of their own purchase. */
@Injectable()
export class GetTemplatePurchaseHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,
  ) {}

  async execute(
    query: GetTemplatePurchaseQuery,
  ): Promise<CreateTemplatePurchaseResponseDto> {
    const purchase = await this.purchaseRepository.findById(query.purchaseId);

    // Someone else's purchase answers like a missing one (same as checkout).
    if (!purchase || purchase.getBuyerId() !== query.buyerId) {
      throw new NotFoundException('Template purchase not found');
    }

    return CreateTemplatePurchaseResponseDto.fromDomain(purchase);
  }
}
