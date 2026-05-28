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
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { AddDatabaseViewToBlockDto } from '../dto/create-page_block.dto';
import { PageBlockResponseDto } from '../dto/response/page_block.response.dto';
import { UpdatePageBlockDto } from '../dto/update-page_block.dto';
import { type CreatePageBlockApplication } from '../interfaces/applications/create-page_block.application.interface';
import { type UpdatePageBlockApplication } from '../interfaces/applications/update.page_block.application.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';
import { type FindPageBlockApplication } from '../interfaces/applications/find.page_block.application.interface';
import { type DeletePageBlockApplication } from '../interfaces/applications/delete.page-block.application.interface';
import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';

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

  @Patch(':id')
  update(@Body() updatePageBlockDto: UpdatePageBlockDto) {
    return this.updatePageBlockApplication.update({
      ...updatePageBlockDto,
    });
  }

  @Post(':blockId/database-views')
  @ResponseMessage('Add database view')
  async addDatabaseViewToBlock(
    @Param('blockId') blockId: string,
    @Body() dto: AddDatabaseViewToBlockDto,
  ): Promise<PageBlockResponseDto> {
    return await this.createPageBlockApplication.addDatabaseViewToBlock(
      blockId,
      dto,
    );
  }

  @Get('trash')
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
  async deletePageBlock(
    @Param('blockId') blockId: string,
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
  async restorePageBlock(
    @Param('blockId') blockId: string,
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
