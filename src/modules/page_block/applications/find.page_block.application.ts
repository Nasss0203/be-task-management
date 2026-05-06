import { Inject, Injectable } from '@nestjs/common';
import { PageBlockMapper } from '../mapper/page_block.mapper';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { FindPageBlockApplication } from '../interfaces/applications/find.page_block.application.interface';
import {type  FindPageBlockService } from '../interfaces/services/find.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class FindPageBlockApplicationImpl implements FindPageBlockApplication {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.services.FindPageBlockService)
    private readonly findPageBlockService: FindPageBlockService,
  ) {}

  async findDeletedPageBlocks(
    workspaceId: string,
    pageId?: string,
  ): Promise<PageBlockResponseDto[]> {
    const blocks = await this.findPageBlockService.findDeletedPageBlocks(
      workspaceId,
      pageId,
    );

    return blocks.map((block) => PageBlockMapper.toResponse(block));
  }
}
