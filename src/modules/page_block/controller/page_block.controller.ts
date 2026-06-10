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
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import {
  AddDatabaseViewToBlockDto,
  CreatePageBlockDto,
} from '../dto/create-page_block.dto';
import { ReorderPageBlockDto } from '../dto/reorder-page_block.dto';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import { type CreatePageBlockApplication } from '../interfaces/applications/create-page_block.application.interface';
import { type DeletePageBlockApplication } from '../interfaces/applications/delete.page-block.application.interface';
import { type FindPageBlockApplication } from '../interfaces/applications/find.page_block.application.interface';
import { type UpdatePageBlockApplication } from '../interfaces/applications/update.page_block.application.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Controller('pageBlock')
export class PageBlockController {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.applications.UpdatePageBlockApplication)
    private readonly updatePageBlockApplication: UpdatePageBlockApplication,

    @Inject(PAGE_BLOCK_TYPES.applications.CreatePageBlockApplication)
    private readonly createPageBlockApplication: CreatePageBlockApplication,

    @Inject(PAGE_BLOCK_TYPES.applications.FindPageBlockApplication)
    private readonly findPageBlockApplication: FindPageBlockApplication,

    @Inject(PAGE_BLOCK_TYPES.applications.DeletePageBlockApplication)
    private readonly deletePageBlockApplication: DeletePageBlockApplication,
  ) {}

  @Post()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'page_id' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_CREATE)
  @ResponseMessage('Create page block')
  create(
    @Body() createPageBlockDto: CreatePageBlockDto,
    @Auth() auth: IAuth,
  ): Promise<PageBlockResponseDto> {
    return this.createPageBlockApplication.create({
      ...createPageBlockDto,
      created_by: auth.id,
    });
  }

  @Get('page/:pageId')
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_READ)
  @ResponseMessage('Find page blocks by page')
  findAllByPageId(
    @Param('pageId', ParseUUIDPipe) pageId: string,
  ): Promise<PageBlockResponseDto[]> {
    return this.findPageBlockApplication.findAllByPageId(pageId);
  }

  @Patch('reorder')
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'page_id' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Reorder page blocks')
  reorder(
    @Body() reorderPageBlockDto: ReorderPageBlockDto,
  ): Promise<PageBlockResponseDto[]> {
    return this.updatePageBlockApplication.reorder(reorderPageBlockDto);
  }

  @Patch(':id')
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'id' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePageBlockDto: UpdatePageBlockDto,
  ) {
    return this.updatePageBlockApplication.update({
      ...updatePageBlockDto,
      id,
    });
  }

  @Post(':blockId/database-views')
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_UPDATE)
  @ResponseMessage('Add database view')
  async addDatabaseViewToBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: AddDatabaseViewToBlockDto,
  ): Promise<PageBlockResponseDto> {
    return await this.createPageBlockApplication.addDatabaseViewToBlock(
      blockId,
      dto,
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

    return this.findPageBlockApplication.findDeletedPageBlocks(
      workspaceId,
      pageId,
    );
  }

  @Delete(':blockId')
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async deletePageBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    await this.deletePageBlockApplication.delete({
      workspaceId,
      blockId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }

  @Patch(':blockId/restore')
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_BLOCK_DELETE)
  async restorePageBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Query('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    await this.deletePageBlockApplication.restore({
      workspaceId,
      blockId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }
}
