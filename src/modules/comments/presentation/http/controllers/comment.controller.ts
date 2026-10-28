import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { CreateCommentCommand } from 'src/modules/comments/application/commands/comment/create-comment/create-comment.command';
import { CreateCommentHandler } from 'src/modules/comments/application/commands/comment/create-comment/create-comment.handler';
import { DeleteCommentCommand } from 'src/modules/comments/application/commands/comment/delete-comment/delete-comment.command';
import { DeleteCommentHandler } from 'src/modules/comments/application/commands/comment/delete-comment/delete-comment.handler';
import { UpdateCommentCommand } from 'src/modules/comments/application/commands/comment/update-comment/update-comment.command';
import { UpdateCommentHandler } from 'src/modules/comments/application/commands/comment/update-comment/update-comment.handler';
import { CreateCommentRequestDto } from 'src/modules/comments/application/dto/comment/request/create-comment.request.dto';
import { UpdateCommentRequestDto } from 'src/modules/comments/application/dto/comment/request/update-comment.request.dto';
import { CommentResponseDto } from 'src/modules/comments/application/dto/comment/response/comment.response.dto';
import { CountBlockCommentsHandler } from 'src/modules/comments/application/queries/comment/count-block-comments/count-block-comments.handler';
import { CountBlockCommentsQuery } from 'src/modules/comments/application/queries/comment/count-block-comments/count-block-comments.query';
import { ListCommentsHandler } from 'src/modules/comments/application/queries/comment/list-comments/list-comments.handler';
import { ListCommentsQuery } from 'src/modules/comments/application/queries/comment/list-comments/list-comments.query';
import { CommentTargetType } from 'src/modules/comments/domain/enums/comment-target-type.enum';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';

@Controller()
export class CommentController {
  constructor(
    private readonly createCommentHandler: CreateCommentHandler,
    private readonly updateCommentHandler: UpdateCommentHandler,
    private readonly deleteCommentHandler: DeleteCommentHandler,
    private readonly listCommentsHandler: ListCommentsHandler,
    private readonly countBlockCommentsHandler: CountBlockCommentsHandler,
  ) {}

  @Get('page/:pageId/comments/block-counts')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_READ)
  @ResponseMessage('Count block comments')
  countBlockComments(
    @Param('pageId', ParseUUIDPipe) pageId: string,
  ): Promise<Record<string, number>> {
    return this.countBlockCommentsHandler.execute(
      new CountBlockCommentsQuery(pageId),
    );
  }

  @Get('pageBlock/:blockId/comments')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_READ)
  @ResponseMessage('List block comments')
  listBlockComments(
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ): Promise<CommentResponseDto[]> {
    return this.listCommentsHandler.execute(
      new ListCommentsQuery(CommentTargetType.PAGE_BLOCK, blockId),
    );
  }

  @Post('pageBlock/:blockId/comments')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page_block', key: 'blockId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_CREATE)
  @ResponseMessage('Create block comment')
  createBlockComment(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: CreateCommentRequestDto,
    @Auth() auth: IAuth,
  ): Promise<CommentResponseDto> {
    return this.createCommentHandler.execute(
      new CreateCommentCommand(
        CommentTargetType.PAGE_BLOCK,
        blockId,
        auth.id,
        dto.body,
        dto.parent_comment_id ?? null,
      ),
    );
  }

  @Get('page/:pageId/comments')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_READ)
  @ResponseMessage('List page comments')
  listPageComments(
    @Param('pageId', ParseUUIDPipe) pageId: string,
  ): Promise<CommentResponseDto[]> {
    return this.listCommentsHandler.execute(
      new ListCommentsQuery(CommentTargetType.PAGE, pageId),
    );
  }

  @Get('database-rows/:rowId/comments')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database_row', key: 'rowId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_READ)
  @ResponseMessage('List row comments')
  listRowComments(
    @Param('rowId', ParseUUIDPipe) rowId: string,
  ): Promise<CommentResponseDto[]> {
    return this.listCommentsHandler.execute(
      new ListCommentsQuery(CommentTargetType.DATABASE_ROW, rowId),
    );
  }

  @Post('database-rows/:rowId/comments')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'database_row', key: 'rowId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_CREATE)
  @ResponseMessage('Create row comment')
  createRowComment(
    @Param('rowId', ParseUUIDPipe) rowId: string,
    @Body() dto: CreateCommentRequestDto,
    @Auth() auth: IAuth,
  ): Promise<CommentResponseDto> {
    return this.createCommentHandler.execute(
      new CreateCommentCommand(
        CommentTargetType.DATABASE_ROW,
        rowId,
        auth.id,
        dto.body,
        dto.parent_comment_id ?? null,
      ),
    );
  }

  @Post('page/:pageId/comments')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'page', key: 'pageId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_CREATE)
  @ResponseMessage('Create page comment')
  createPageComment(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Body() dto: CreateCommentRequestDto,
    @Auth() auth: IAuth,
  ): Promise<CommentResponseDto> {
    return this.createCommentHandler.execute(
      new CreateCommentCommand(
        CommentTargetType.PAGE,
        pageId,
        auth.id,
        dto.body,
        dto.parent_comment_id ?? null,
      ),
    );
  }

  @Patch('comments/:commentId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'comment', key: 'commentId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_CREATE)
  @ResponseMessage('Update comment')
  updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentRequestDto,
    @Auth() auth: IAuth,
  ): Promise<CommentResponseDto> {
    return this.updateCommentHandler.execute(
      new UpdateCommentCommand(commentId, auth.id, dto.body),
    );
  }

  @Delete('comments/:commentId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'comment', key: 'commentId' })
  @RequirePermissions(PERMISSIONS.PAGE_COMMENT_CREATE)
  @ResponseMessage('Delete comment')
  async deleteComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteCommentHandler.execute(
      new DeleteCommentCommand(commentId, auth.id),
    );

    return { success: true };
  }
}
