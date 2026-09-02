import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { FindPageBlockByIdQuery } from './find-page-block-by-id.query';

@Injectable()
export class FindPageBlockByIdHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
  ) {}

  async execute(query: FindPageBlockByIdQuery): Promise<PageBlockResponseDto> {
    const block = await this.pageBlockRepo.findById(query.blockId);

    if (!block) {
      throw new NotFoundException('Page block not found');
    }

    return PageBlockResponseDto.fromDomain(block);
  }
}
