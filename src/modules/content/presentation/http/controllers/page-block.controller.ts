import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
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
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { AddDatabaseViewToBlockCommand } from 'src/modules/content/application/commands/page-block/add-database-view-to-block/add-database-view-to-block.command';
import { AddDatabaseViewToBlockHandler } from 'src/modules/content/application/commands/page-block/add-database-view-to-block/add-database-view-to-block.handler';
import { CreatePageBlockCommand } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.command';
import { CreatePageBlockHandler } from 'src/modules/content/application/commands/page-block/create-page-block/create-page-block.handler';
import { DeletePageBlockCommand } from 'src/modules/content/application/commands/page-block/delete-page-block/delete-page-block.command';
import { DeletePageBlockHandler } from 'src/modules/content/application/commands/page-block/delete-page-block/delete-page-block.handler';
import { DuplicatePageBlockCommand } from 'src/modules/content/application/commands/page-block/duplicate-page-block/duplicate-page-block.command';
import { DuplicatePageBlockHandler } from 'src/modules/content/application/commands/page-block/duplicate-page-block/duplicate-page-block.handler';
import { MovePageBlockCommand } from 'src/modules/content/application/commands/page-block/move-page-block/move-page-block.command';
import { MovePageBlockHandler } from 'src/modules/content/application/commands/page-block/move-page-block/move-page-block.handler';
import { ReorderPageBlockCommand } from 'src/modules/content/application/commands/page-block/reorder-page-block/reorder-page-block.command';
import { ReorderPageBlockHandler } from 'src/modules/content/application/commands/page-block/reorder-page-block/reorder-page-block.handler';
import { RestorePageBlockCommand } from 'src/modules/content/application/commands/page-block/restore-page-block/restore-page-block.command';
import { RestorePageBlockHandler } from 'src/modules/content/application/commands/page-block/restore-page-block/restore-page-block.handler';
import { UpdatePageBlockCommand } from 'src/modules/content/application/commands/page-block/update-page-block/update-page-block.command';
import { UpdatePageBlockHandler } from 'src/modules/content/application/commands/page-block/update-page-block/update-page-block.handler';
import {
  AddDatabaseViewToBlockDto,
  CreatePageBlockDto,
} from 'src/modules/content/application/dto/page/create-page-block.dto';
import { MovePageBlockDto } from 'src/modules/content/application/dto/page/move-page-block.dto';
import { ReorderPageBlockDto } from 'src/modules/content/application/dto/page/reorder-page-block.dto';
import { PageBlockResponseDto } from 'src/modules/content/application/dto/page/response/page-block.response.dto';
import { UpdatePageBlockDto } from 'src/modules/content/application/dto/page/update-page-block.dto';
import { FindDeletedPageBlocksHandler } from 'src/modules/content/application/queries/page-block/find-deleted-page-blocks/find-deleted-page-blocks.handler';
import { FindDeletedPageBlocksQuery } from 'src/modules/content/application/queries/page-block/find-deleted-page-blocks/find-deleted-page-blocks.query';
import { FindPageBlockByIdHandler } from 'src/modules/content/application/queries/page-block/find-page-block-by-id/find-page-block-by-id.handler';
import { FindPageBlockByIdQuery } from 'src/modules/content/application/queries/page-block/find-page-block-by-id/find-page-block-by-id.query';
import { FindPageBlockByPageHandler } from 'src/modules/content/application/queries/page-block/find-page-block-by-page/find-page-block-by-page.handler';
import { FindPageBlockByRowHandler } from 'src/modules/content/application/queries/page-block/find-page-block-by-row/find-page-block-by-row.handler';
import { FindPageBlockByRowQuery } from 'src/modules/content/application/queries/page-block/find-page-block-by-row/find-page-block-by-row.query';
import { FindPageBlockByPageQuery } from 'src/modules/content/application/queries/page-block/find-page-block-by-page/find-page-block-by-page.query';
import { ResolveBookmarkMetadataHandler } from 'src/modules/content/application/queries/resolve-bookmark-metadata/resolve-bookmark-metadata.handler';
import { ResolveBookmarkMetadataQuery } from 'src/modules/content/application/queries/resolve-bookmark-metadata/resolve-bookmark-metadata.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreatePageBlockColumnsDto } from 'src/modules/content/application/dto/page/create-page-block-columns.dto';
import { CreatePageBlockColumnsCommand } from 'src/modules/content/application/commands/page-block/create-page-block-columns/create-page-block-columns.command';
import { CreatePageBlockColumnsHandler } from 'src/modules/content/application/commands/page-block/create-page-block-columns/create-page-block-columns.handler';
import { ResolveBookmarkMetadataRequest } from '../requests/resolve-bookmark-metadata.request';

@Controller('pageBlock')
@ReadRateLimit()
export class PageBlockController {
  constructor(
    @Inject(CONTENT_TYPES.applications.UpdatePageBlockHandler)
    private readonly updatePageBlockHandler: UpdatePageBlockHandler,

    @Inject(CONTENT_TYPES.applications.ReorderPageBlockHandler)
    private readonly reorderPageBlockHandler: ReorderPageBlockHandler,

    @Inject(CONTENT_TYPES.applications.MovePageBlockHandler)
    private readonly movePageBlockHandler: MovePageBlockHandler,

    @Inject(CONTENT_TYPES.applications.CreatePageBlockHandler)
    private readonly createPageBlockHandler: CreatePageBlockHandler,

    @Inject(CONTENT_TYPES.applications.AddDatabaseViewToBlockHandler)
    private readonly addDatabaseViewToBlockHandler: AddDatabaseViewToBlockHandler,

    @Inject(CONTENT_TYPES.applications.FindPageBlockByPageHandler)
    private readonly findPageBlockByPageHandler: FindPageBlockByPageHandler,

    @Inject(CONTENT_TYPES.applications.FindPageBlockByRowHandler)
    private readonly findPageBlockByRowHandler: FindPageBlockByRowHandler,

    @Inject(CONTENT_TYPES.applications.FindPageBlockByIdHandler)
    private readonly findPageBlockByIdHandler: FindPageBlockByIdHandler,

    @Inject(CONTENT_TYPES.applications.FindDeletedPageBlocksHandler)
    private readonly findDeletedPageBlocksHandler: FindDeletedPageBlocksHandler,

    @Inject(CONTENT_TYPES.applications.DeletePageBlockHandler)
    private readonly deletePageBlockHandler: DeletePageBlockHandler,

    @Inject(CONTENT_TYPES.applications.RestorePageBlockHandler)
    private readonly restorePageBlockHandler: RestorePageBlockHandler,

    @Inject(CONTENT_TYPES.applications.DuplicatePageBlockHandler)
    private readonly duplicatePageBlockHandler: DuplicatePageBlockHandler,

    @Inject(CONTENT_TYPES.applications.CreatePageBlockColumnsHandler)
    private readonly createPageBlockColumnsHandler: CreatePageBlockColumnsHandler,

    private readonly resolveBookmarkMetadataHandler: ResolveBookmarkMetadataHandler,
  ) {}

  @Post()
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'page_id' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  @ResponseMessage('Create page block')
  create(
    @Body() createPageBlockDto: CreatePageBlockDto,
    @Auth() auth: IAuth,
  ): Promise<PageBlockResponseDto> {
    return this.createPageBlockHandler.execute(
      new CreatePageBlockCommand({
        pageId: createPageBlockDto.page_id,
        rowId: createPageBlockDto.row_id,
        parentBlockId: createPageBlockDto.parent_block_id,
        afterBlockId: createPageBlockDto.after_block_id,
        type: createPageBlockDto.type,
        title: createPageBlockDto.title,
        positionX: createPageBlockDto.position_x,
        positionY: createPageBlockDto.position_y,
        width: createPageBlockDto.width,
        height: createPageBlockDto.height,
        content: createPageBlockDto.content,
        styleConfig: createPageBlockDto.style_config,
        dataConfig: createPageBlockDto.data_config,
        createdBy: auth.id,
        isOpen: createPageBlockDto.is_open,
      }),
    );
  }

  @Get('page/:pageId')
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  @ResponseMessage('Find page blocks by page')
  findAllByPageId(
    @Param('pageId', ParseUUIDPipe) pageId: string,
  ): Promise<PageBlockResponseDto[]> {
    return this.findPageBlockByPageHandler.execute(
      new FindPageBlockByPageQuery(pageId),
    );
  }

  /** A task's content; readable by whoever can read the page holding its database. */
  @Get('row/:rowId')
  @WorkspaceContext({ source: 'resource', type: 'database_row', key: 'rowId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  @ResponseMessage('Find page blocks by database row')
  findAllByRowId(
    @Param('rowId', ParseUUIDPipe) rowId: string,
  ): Promise<PageBlockResponseDto[]> {
    return this.findPageBlockByRowHandler.execute(
      new FindPageBlockByRowQuery(rowId),
    );
  }

  @Get('trash')
  @WorkspaceContext({ source: 'query', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  async findDeletedPageBlocks(
    @Query('workspaceId') workspaceId: string,
    @Query('pageId') pageId?: string,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }
    return this.findDeletedPageBlocksHandler.execute(
      new FindDeletedPageBlocksQuery(workspaceId, pageId),
    );
  }

  @Get(':blockId')
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  @ResponseMessage('Find page block by id')
  findById(
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ): Promise<PageBlockResponseDto> {
    return this.findPageBlockByIdHandler.execute(
      new FindPageBlockByIdQuery(blockId),
    );
  }

  @Patch('reorder')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'page_id' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Reorder page blocks')
  reorder(
    @Body() reorderPageBlockDto: ReorderPageBlockDto,
  ): Promise<PageBlockResponseDto[]> {
    return this.reorderPageBlockHandler.execute(
      new ReorderPageBlockCommand(reorderPageBlockDto),
    );
  }

  @Patch(':blockId/move')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Move page block')
  move(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() movePageBlockDto: MovePageBlockDto,
    @Auth() auth: IAuth,
  ): Promise<PageBlockResponseDto> {
    return this.movePageBlockHandler.execute(
      new MovePageBlockCommand(blockId, movePageBlockDto, auth.id),
    );
  }

  @Patch(':id')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'id' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePageBlockDto: UpdatePageBlockDto,
    @Auth() auth: IAuth,
  ) {
    return this.updatePageBlockHandler.execute(
      new UpdatePageBlockCommand(
        id,
        {
          type: updatePageBlockDto.type,
          title: updatePageBlockDto.title,
          positionX: updatePageBlockDto.position_x,
          positionY: updatePageBlockDto.position_y,
          width: updatePageBlockDto.width,
          height: updatePageBlockDto.height,
          content: updatePageBlockDto.content,
          styleConfig: updatePageBlockDto.style_config,
          dataConfig: updatePageBlockDto.data_config,
          isOpen: updatePageBlockDto.is_open,
        },
        auth.id,
      ),
    );
  }

  @Post(':blockId/database-views')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Add database view')
  async addDatabaseViewToBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: AddDatabaseViewToBlockDto,
  ): Promise<PageBlockResponseDto> {
    return await this.addDatabaseViewToBlockHandler.execute(
      new AddDatabaseViewToBlockCommand(blockId, dto),
    );
  }

  @Delete(':blockId')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async deletePageBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deletePageBlockHandler.execute(
      new DeletePageBlockCommand(blockId, auth.id),
    );
    return { success: true };
  }

  @Patch(':blockId/restore')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async restorePageBlock(@Param('blockId', ParseUUIDPipe) blockId: string) {
    await this.restorePageBlockHandler.execute(
      new RestorePageBlockCommand(blockId),
    );
    return { success: true };
  }

  @Post(':blockId/duplicate')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  @ResponseMessage('Duplicate page block')
  duplicate(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Auth() auth: IAuth,
  ): Promise<PageBlockResponseDto> {
    return this.duplicatePageBlockHandler.execute(
      new DuplicatePageBlockCommand(blockId, auth.id),
    );
  }

  /** Sets 2–5 blocks side by side in a new column row (drag to a block's edge, "2 columns"). */
  @Post('columns')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'page_id' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Create page block columns')
  createColumns(
    @Body() dto: CreatePageBlockColumnsDto,
    @Auth() auth: IAuth,
  ): Promise<PageBlockResponseDto> {
    return this.createPageBlockColumnsHandler.execute(
      new CreatePageBlockColumnsCommand(dto.page_id, dto.block_ids, auth.id),
    );
  }

  @Post('bookmark/metadata')
  @ReadRateLimit()
  @ResponseMessage('Resolve bookmark metadata')
  resolveBookmarkMetadata(@Body() body: ResolveBookmarkMetadataRequest) {
    return this.resolveBookmarkMetadataHandler.execute(
      new ResolveBookmarkMetadataQuery(body.url),
    );
  }
}
