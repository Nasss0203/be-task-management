import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { type FindPageApplication } from '../interfaces/applications/find-page.application.interface';
import { PAGE_TYPES } from '../interfaces/types';
import { PageService } from '../page.service';

@Controller('page')
export class PageController {
  constructor(
    private readonly pageService: PageService,

    @Inject(PAGE_TYPES.applications.FindPageApplication)
    private readonly findPageApplication: FindPageApplication,
  ) {}

  @Post()
  create(@Body() createPageDto: CreatePageDto) {
    return this.pageService.create(createPageDto);
  }

  @ResponseMessage('Find page by workspace')
  @Get('workspace/:workspaceId')
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    return await this.findPageApplication.findPageByWorkspaceId(
      auth.id,
      workspaceId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pageService.update(+id, updatePageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pageService.remove(+id);
  }
}
