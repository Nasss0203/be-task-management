import { Body, Controller, Inject, Patch } from '@nestjs/common';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import { type UpdatePageBlockApplication } from '../interfaces/applications/update.page_block.application.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Controller('pageBlock')
export class PageBlockController {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.applications.UpdatePageBlockApplication)
    private readonly updatePageBlockApplication: UpdatePageBlockApplication,
  ) {}

  @Patch(':id')
  update(@Body() updatePageBlockDto: UpdatePageBlockDto) {
    return this.updatePageBlockApplication.update({
      ...updatePageBlockDto,
    });
  }
}
