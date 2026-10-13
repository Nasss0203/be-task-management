import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { TemplateEntitlementRepository } from '../../../../domain/repositories/template-entitlement.repository';
import {
  ClaimedTemplateResponseDto,
  MyClaimedTemplatesResponseDto,
} from '../../../dto/template-entitlement/my-claimed-templates.response.dto';
import {
  decodeTemplateListCursor,
  encodeTemplateListCursor,
} from '../../../../../template/application/queries/page-template/list-page-templates/template-list-cursor.helper';
import { GetMyClaimedTemplatesQuery } from './get-my-claimed-templates.query';

@Injectable()
export class GetMyClaimedTemplatesHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplateEntitlementRepository)
    private readonly templateEntitlementRepository: TemplateEntitlementRepository,
  ) {}

  async execute(
    query: GetMyClaimedTemplatesQuery,
  ): Promise<MyClaimedTemplatesResponseDto> {
    const limit = query.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException(
        'limit must be an integer between 1 and 100',
      );
    }
    const cursor =
      query.cursor !== undefined
        ? decodeTemplateListCursor(query.cursor)
        : undefined;
    const result = await this.templateEntitlementRepository.findClaimedByUser({
      userId: query.userId,
      cursor,
      limit,
    });
    const last = result.items.at(-1);
    return {
      items: result.items.map(ClaimedTemplateResponseDto.fromReadModel),
      nextCursor:
        result.hasNextPage && last
          ? encodeTemplateListCursor({
              createdAt: last.claimedAt,
              id: last.entitlementId,
            })
          : null,
    };
  }
}
