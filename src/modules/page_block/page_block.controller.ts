import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PageBlockService } from './page_block.service';
import { CreatePageBlockDto } from './dto/create-page_block.dto';
import { UpdatePageBlockDto } from './dto/update-page_block.dto';

@Controller('page-block')
export class PageBlockController {
  constructor(private readonly pageBlockService: PageBlockService) {}

  @Post()
  create(@Body() createPageBlockDto: CreatePageBlockDto) {
    return this.pageBlockService.create(createPageBlockDto);
  }

  @Get()
  findAll() {
    return this.pageBlockService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pageBlockService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePageBlockDto: UpdatePageBlockDto) {
    return this.pageBlockService.update(+id, updatePageBlockDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pageBlockService.remove(+id);
  }
}
