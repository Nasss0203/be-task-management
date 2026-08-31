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
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  StrictWriteRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import {
  CreatePageCommand,
  CreatePageHandler,
} from 'src/modules/content/application/commands/page/create-page.handler';
import {
  DeletePageCommand,
  DeletePageHandler,
  PermanentlyDeletePageCommand,
  RestorePageCommand,
} from 'src/modules/content/application/commands/page/delete-page.handler';
import {
  UpdatePageCommand,
  UpdatePageHandler,
} from 'src/modules/content/application/commands/page/update-page.handler';
import { CreatePageDto } from 'src/modules/content/application/dto/page/create-page.dto';
import { UpdatePageDto } from 'src/modules/content/application/dto/page/update-page.dto';
import {
  FindDeletedPagesQuery,
  FindPageByIdQuery,
  FindPageByWorkspaceQuery,
  FindPageHandler,
} from 'src/modules/content/application/queries/page/find-page.handler';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';

@Controller('page')
@ReadRateLimit()
export class PageController {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageHandler)
    private readonly createPageHandler: CreatePageHandler,

    @Inject(CONTENT_TYPES.applications.FindPageHandler)
    private readonly findPageHandler: FindPageHandler,

    @Inject(CONTENT_TYPES.applications.DeletePageHandler)
    private readonly deletePageHandler: DeletePageHandler,

    @Inject(CONTENT_TYPES.applications.UpdatePageHandler)
    private readonly updatePageHandler: UpdatePageHandler,
  ) {}

  @Post()
  @WriteRateLimit()
  @ResponseMessage('Create page')
  create(@Body() createPageDto: CreatePageDto, @Auth() auth: IAuth) {
    return this.createPageHandler.execute(
      new CreatePageCommand(
        auth.id,
        createPageDto.workspace_id,
        createPageDto.title,
        createPageDto.teamspace_id ?? null,
        createPageDto.icon,
        createPageDto.cover_url,
      ),
    );
  }

  @Get('trash')
  @WorkspaceContext({ source: 'query', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  async findDeletedPages(
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!auth?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.findPageHandler.findDeletedPages(
      new FindDeletedPagesQuery(workspaceId, auth.id),
    );
  }

  @Delete('trash/:pageId')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_DELETE)
  async permanentlyDeletePage(@Param('pageId') pageId: string) {
    await this.deletePageHandler.permanentlyDelete(
      new PermanentlyDeletePageCommand(pageId),
    );
    return { success: true };
  }

  @ResponseMessage('Find page by workspace')
  @Get('workspace/:workspaceId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    return this.findPageHandler.findPageByWorkspaceId(
      new FindPageByWorkspaceQuery(workspaceId, auth.id),
    );
  }

  @Get(':pageId')
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  async findPageById(@Param('pageId') pageId: string) {
    return this.findPageHandler.findPageById(new FindPageByIdQuery(pageId));
  }

  @Patch(':pageId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_UPDATE)
  @ResponseMessage('Update page')
  updatePage(@Param('pageId') pageId: string, @Body() dto: UpdatePageDto) {
    return this.updatePageHandler.execute(new UpdatePageCommand(pageId, dto));
  }

  @Delete(':pageId')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_DELETE)
  async deletePage(
    @Param('pageId') pageId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }
    await this.deletePageHandler.delete(
      new DeletePageCommand(workspaceId, pageId, auth.id),
    );
    return { success: true };
  }

  @Patch(':pageId/restore')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'query', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.PAGE_DELETE)
  async restorePage(
    @Param('pageId') pageId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }
    await this.deletePageHandler.restore(
      new RestorePageCommand(workspaceId, pageId, auth.id),
    );
    return { success: true };
  }
}
