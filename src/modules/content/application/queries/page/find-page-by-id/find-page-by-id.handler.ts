import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { FindPageByIdQuery } from './find-page-by-id.query';

@Injectable()
export class FindPageByIdHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(query: FindPageByIdQuery): Promise<PageResponseDto> {
    const page = await this.pageRepo.findById(query.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return PageResponseDto.fromDomain(page);
  }
}
