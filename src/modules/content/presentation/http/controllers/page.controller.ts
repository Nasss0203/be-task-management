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
import { CreatePageCommand } from 'src/modules/content/application/commands/page/create-page/create-page.command';
import { CreatePageHandler } from 'src/modules/content/application/commands/page/create-page/create-page.handler';
import { DeletePageCommand } from 'src/modules/content/application/commands/page/delete-page/delete-page.command';
import { DeletePageHandler } from 'src/modules/content/application/commands/page/delete-page/delete-page.handler';
import { PermanentlyDeletePageCommand } from 'src/modules/content/application/commands/page/permanently-delete-page/permanently-delete-page.command';
import { PermanentlyDeletePageHandler } from 'src/modules/content/application/commands/page/permanently-delete-page/permanently-delete-page.handler';
import { RestorePageCommand } from 'src/modules/content/application/commands/page/restore-page/restore-page.command';
import { RestorePageHandler } from 'src/modules/content/application/commands/page/restore-page/restore-page.handler';
import { UpdatePageCommand } from 'src/modules/content/application/commands/page/update-page/update-page.command';
import { UpdatePageHandler } from 'src/modules/content/application/commands/page/update-page/update-page.handler';
import { CreatePageDto } from 'src/modules/content/application/dto/page/create-page.dto';
import { UpdatePageDto } from 'src/modules/content/application/dto/page/update-page.dto';
import { FindDeletedPagesHandler } from 'src/modules/content/application/queries/page/find-deleted-pages/find-deleted-pages.handler';
import { FindDeletedPagesQuery } from 'src/modules/content/application/queries/page/find-deleted-pages/find-deleted-pages.query';
import { FindPageByIdHandler } from 'src/modules/content/application/queries/page/find-page-by-id/find-page-by-id.handler';
import { FindPageByIdQuery } from 'src/modules/content/application/queries/page/find-page-by-id/find-page-by-id.query';
import { FindPageByWorkspaceHandler } from 'src/modules/content/application/queries/page/find-page-by-workspace/find-page-by-workspace.handler';
import { FindPageByWorkspaceQuery } from 'src/modules/content/application/queries/page/find-page-by-workspace/find-page-by-workspace.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';

@Controller('page')
@ReadRateLimit()
export class PageController {
  constructor(
    @Inject(CONTENT_TYPES.applications.CreatePageHandler)
    private readonly createPageHandler: CreatePageHandler,

    @Inject(CONTENT_TYPES.applications.FindPageByWorkspaceHandler)
    private readonly findPageByWorkspaceHandler: FindPageByWorkspaceHandler,

    @Inject(CONTENT_TYPES.applications.FindDeletedPagesHandler)
    private readonly findDeletedPagesHandler: FindDeletedPagesHandler,

    @Inject(CONTENT_TYPES.applications.FindPageByIdHandler)
    private readonly findPageByIdHandler: FindPageByIdHandler,

    @Inject(CONTENT_TYPES.applications.DeletePageHandler)
    private readonly deletePageHandler: DeletePageHandler,

    @Inject(CONTENT_TYPES.applications.RestorePageHandler)
    private readonly restorePageHandler: RestorePageHandler,

    @Inject(CONTENT_TYPES.applications.PermanentlyDeletePageHandler)
    private readonly permanentlyDeletePageHandler: PermanentlyDeletePageHandler,

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
        createPageDto.parent_page_id ?? null,
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

    return this.findDeletedPagesHandler.execute(
      new FindDeletedPagesQuery(workspaceId, auth.id),
    );
  }
  @Delete('trash/:pageId')
  @StrictWriteRateLimit()
  @WorkspaceContext({
    source: 'query',
    key: 'workspaceId',
  })
  @RequirePermissions(PERMISSIONS.PAGE_DELETE)
  async permanentlyDeletePage(
    @Param('pageId') pageId: string,
    @Query('workspaceId')
    workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    await this.permanentlyDeletePageHandler.execute(
      new PermanentlyDeletePageCommand(workspaceId, pageId),
    );

    return {
      success: true,
    };
  }
  c;

  @ResponseMessage('Find page by workspace')
  @Get('workspace/:workspaceId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    return this.findPageByWorkspaceHandler.execute(
      new FindPageByWorkspaceQuery(workspaceId, auth.id),
    );
  }

  @Get(':pageId')
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_READ)
  async findPageById(@Param('pageId') pageId: string) {
    return this.findPageByIdHandler.execute(new FindPageByIdQuery(pageId));
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
    await this.deletePageHandler.execute(
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
    await this.restorePageHandler.execute(
      new RestorePageCommand(workspaceId, pageId, auth.id),
    );
    return { success: true };
  }
}
