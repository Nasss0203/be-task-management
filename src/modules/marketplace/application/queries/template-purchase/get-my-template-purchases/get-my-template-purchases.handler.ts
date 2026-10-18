import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import {
  decodeTemplateListCursor,
  encodeTemplateListCursor,
} from '../../../../../template/application/queries/page-template/list-page-templates/template-list-cursor.helper';
import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';
import {
  TemplatePurchaseHistoryItemDto,
  type TemplatePurchaseHistoryResponseDto,
} from '../../../dto/template-purchase/template-purchase-history.response.dto';
import { GetMyTemplatePurchasesQuery } from './get-my-template-purchases.query';

/** Read-only: the signed-in buyer's own purchases, newest first. */
@Injectable()
export class GetMyTemplatePurchasesHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,
  ) {}

  async execute(
    query: GetMyTemplatePurchasesQuery,
  ): Promise<TemplatePurchaseHistoryResponseDto> {
    const limit = query.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'limit must be an integer between 1 and 100',
      );
    }
    const result = await this.purchaseRepository.findHistoryByBuyer({
      buyerId: query.buyerId,
      limit,
      cursor:
        query.cursor !== undefined
          ? decodeTemplateListCursor(query.cursor)
          : undefined,
    });
    const last = result.items.at(-1);
    return {
      items: result.items.map(TemplatePurchaseHistoryItemDto.fromReadModel),
      nextCursor:
        result.hasNextPage && last
          ? encodeTemplateListCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }
}
