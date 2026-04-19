import { Body, Controller, Inject, Param, Patch, Post } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { AddDatabaseViewToBlockDto } from '../dto/create-page_block.dto';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import { type CreatePageBlockApplication } from '../interfaces/applications/create-page_block.application.interface';
import { type UpdatePageBlockApplication } from '../interfaces/applications/update.page_block.application.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Controller('pageBlock')
export class PageBlockController {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.applications.UpdatePageBlockApplication)
    private readonly updatePageBlockApplication: UpdatePageBlockApplication,

    @Inject(PAGE_BLOCK_TYPES.applications.CreatePageBlockApplication)
    private readonly createPageBlockApplication: CreatePageBlockApplication,
  ) {}

  @Patch(':id')
  update(@Body() updatePageBlockDto: UpdatePageBlockDto) {
    return this.updatePageBlockApplication.update({
      ...updatePageBlockDto,
    });
  }

  @Post(':blockId/database-views')
  @ResponseMessage('Add database view')
  addDatabaseViewToBlock(
    @Param('blockId') blockId: string,
    @Body() dto: AddDatabaseViewToBlockDto,
  ): Promise<PageBlockResponseDto> {
    return this.createPageBlockApplication.addDatabaseViewToBlock(blockId, dto);
  }
}
