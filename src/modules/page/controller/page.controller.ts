import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreatePageDto } from '../dto/create-page.dto';
import { type DeletePageApplication } from '../interfaces/applications/delete-page.application.interface';
import { type FindPageApplication } from '../interfaces/applications/find-page.application.interface';
import { PAGE_TYPES } from '../interfaces/types';
import { PageService } from '../page.service';

@Controller('page')
export class PageController {
  constructor(
    private readonly pageService: PageService,

    @Inject(PAGE_TYPES.applications.FindPageApplication)
    private readonly findPageApplication: FindPageApplication,

    @Inject(PAGE_TYPES.applications.DeletePageApplication)
    private readonly deletePageApplication: DeletePageApplication,
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
  @Get('trash')
  async findDeletedPages(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findPageApplication.findDeletedPages(workspaceId);
  }

  @Delete(':pageId')
  async deletePage(
    @Param('pageId') pageId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    await this.deletePageApplication.delete({
      workspaceId,
      pageId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }

  @Patch(':pageId/restore')
  async restorePage(
    @Param('pageId') pageId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    await this.deletePageApplication.restore({
      workspaceId,
      pageId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }
}
