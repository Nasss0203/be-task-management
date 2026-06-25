import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  StrictWriteRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreatePageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { type CreatePageApplication } from '../interfaces/applications/create-page.application.interface';
import { type DeletePageApplication } from '../interfaces/applications/delete-page.application.interface';
import { type FindPageApplication } from '../interfaces/applications/find-page.application.interface';
import { type UpdatePageApplication } from '../interfaces/applications/update-page.application.interface';
import { PAGE_TYPES } from '../interfaces/types';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

@Controller('page')
@ReadRateLimit()
export class PageController {
  constructor(
    @Inject(PAGE_TYPES.applications.CreatePageApplication)
    private readonly createPageApplication: CreatePageApplication,

    @Inject(PAGE_TYPES.applications.FindPageApplication)
    private readonly findPageApplication: FindPageApplication,

    @Inject(PAGE_TYPES.applications.DeletePageApplication)
    private readonly deletePageApplication: DeletePageApplication,

    @Inject(PAGE_TYPES.applications.UpdatePageApplication)
    private readonly updatePageApplication: UpdatePageApplication,
  ) {}

  @Post()
  @WriteRateLimit()
  @RequirePermissions(PERMISSIONS.PAGE_CREATE)
  @ResponseMessage('Create page')
  create(@Body() createPageDto: CreatePageDto, @Auth() auth: IAuth) {
    return this.createPageApplication.create({
      ...createPageDto,
      created_by: auth.id,
    });
  }

  @ResponseMessage('Find page by workspace')
  @Get('workspace/:workspaceId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  async findAll(@Param('workspaceId') workspaceId: string) {
    return await this.findPageApplication.findPageByWorkspaceId(workspaceId);
  }
  @Get('trash')
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  async findDeletedPages(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findPageApplication.findDeletedPages(workspaceId);
  }

  @Patch(':pageId')
  @WriteRateLimit()
  @RequirePermissions(PERMISSIONS.PAGE_UPDATE)
  @ResponseMessage('Update page')
  updatePage(
    @Param('pageId') pageId: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.updatePageApplication.update(pageId, dto);
  }

  @Delete(':pageId')
  @StrictWriteRateLimit()
  @RequirePermissions(PERMISSIONS.PAGE_DELETE)
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
  @StrictWriteRateLimit()
  @RequirePermissions(PERMISSIONS.PAGE_DELETE)
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
