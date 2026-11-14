import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  UploadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { IAuth } from 'src/types/auth';
import { BulkDeleteWorkspaceFilesCommand } from '../../../application/commands/bulk-delete-workspace-files/bulk-delete-workspace-files.command';
import { BulkDeleteWorkspaceFilesHandler } from '../../../application/commands/bulk-delete-workspace-files/bulk-delete-workspace-files.handler';
import { DeleteAttachmentCommand } from '../../../application/commands/delete-attachment/delete-attachment.command';
import { DeleteAttachmentHandler } from '../../../application/commands/delete-attachment/delete-attachment.handler';
import { UpdateAttachmentCommand } from '../../../application/commands/update-attachment/update-attachment.command';
import { UpdateAttachmentHandler } from '../../../application/commands/update-attachment/update-attachment.handler';
import { UploadAttachmentCommand } from '../../../application/commands/upload-attachment/upload-attachment.command';
import { UploadAttachmentHandler } from '../../../application/commands/upload-attachment/upload-attachment.handler';
import {
  ALLOWED_FILE_MIME_REGEX,
  MAX_ATTACHMENT_SIZE,
} from '../../../application/constants/attachment-file.constants';
import { CreateAttachmentDownloadUrlHandler } from '../../../application/queries/create-attachment-download-url/create-attachment-download-url.handler';
import { CreateAttachmentDownloadUrlQuery } from '../../../application/queries/create-attachment-download-url/create-attachment-download-url.query';
import { GetWorkspaceStorageHandler } from '../../../application/queries/get-workspace-storage/get-workspace-storage.handler';
import { GetWorkspaceStorageQuery } from '../../../application/queries/get-workspace-storage/get-workspace-storage.query';
import { ListWorkspaceStorageFilesHandler } from '../../../application/queries/list-workspace-storage-files/list-workspace-storage-files.handler';
import { ListWorkspaceStorageFilesQuery } from '../../../application/queries/list-workspace-storage-files/list-workspace-storage-files.query';
import { BulkDeleteWorkspaceFilesRequest } from '../requests/bulk-delete-workspace-files.request';
import { ListWorkspaceStorageFilesRequest } from '../requests/list-workspace-storage-files.request';
import { UpdateAttachmentRequest } from '../requests/update-attachment.request';
import { UploadAttachmentRequest } from '../requests/upload-attachment.request';

@Controller('attachment')
export class AttachmentController {
  constructor(
    private readonly uploadAttachmentHandler: UploadAttachmentHandler,
    private readonly createDownloadUrlHandler: CreateAttachmentDownloadUrlHandler,
    private readonly updateAttachmentHandler: UpdateAttachmentHandler,
    private readonly deleteAttachmentHandler: DeleteAttachmentHandler,
    private readonly getWorkspaceStorageHandler: GetWorkspaceStorageHandler,
    private readonly listWorkspaceStorageFilesHandler: ListWorkspaceStorageFilesHandler,
    private readonly bulkDeleteWorkspaceFilesHandler: BulkDeleteWorkspaceFilesHandler,
  ) {}

  @Post('upload/:workspaceId')
  @UploadRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_UPLOAD)
  @ResponseMessage('Upload file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_ATTACHMENT_SIZE },
    }),
  )
  upload(
    @Param('workspaceId') workspaceId: string,
    @Body() body: UploadAttachmentRequest,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: ALLOWED_FILE_MIME_REGEX,
          fallbackToMimetype: true,
        })
        .addMaxSizeValidator({ maxSize: MAX_ATTACHMENT_SIZE })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Auth() auth: IAuth,
  ) {
    return this.uploadAttachmentHandler.execute(
      new UploadAttachmentCommand(
        {
          originalName: Buffer.from(file.originalname, 'latin1').toString(
            'utf8',
          ),
          reportedMimeType: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        },
        workspaceId,
        body.commentId ?? null,
        body.pageBlockId ?? null,
        auth.id,
      ),
    );
  }

  @Get('workspaces/:workspaceId/storage')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_READ)
  getWorkspaceStorage(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    return this.getWorkspaceStorageHandler.execute(
      new GetWorkspaceStorageQuery(workspaceId, auth.id),
    );
  }

  @Get('workspaces/:workspaceId/files')
  @ReadRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_READ)
  listWorkspaceFiles(
    @Param('workspaceId') workspaceId: string,
    @Query() query: ListWorkspaceStorageFilesRequest,
    @Auth() auth: IAuth,
  ) {
    return this.listWorkspaceStorageFilesHandler.execute(
      new ListWorkspaceStorageFilesQuery(workspaceId, auth.id, query),
    );
  }

  @Post('workspaces/:workspaceId/files/bulk-delete')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_DELETE)
  @ResponseMessage('Delete files')
  bulkDeleteWorkspaceFiles(
    @Param('workspaceId') workspaceId: string,
    @Body() body: BulkDeleteWorkspaceFilesRequest,
    @Auth() auth: IAuth,
  ) {
    return this.bulkDeleteWorkspaceFilesHandler.execute(
      new BulkDeleteWorkspaceFilesCommand(workspaceId, auth.id, body.ids),
    );
  }

  @Post(':id/download-url')
  @WriteRateLimit()
  @ResponseMessage('Get URL file')
  createDownloadUrl(@Param('id') id: string, @Auth() auth: IAuth) {
    return this.createDownloadUrlHandler.execute(
      new CreateAttachmentDownloadUrlQuery(id, auth.id),
    );
  }

  @Patch(':id')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'attachment', key: 'id' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_UPLOAD)
  update(
    @Param('id') id: string,
    @Body() _body: UpdateAttachmentRequest,
    @Auth() auth: IAuth,
  ) {
    return this.updateAttachmentHandler.execute(
      new UpdateAttachmentCommand(id, auth.id),
    );
  }

  @Delete(':id')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'attachment', key: 'id' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_DELETE)
  delete(@Param('id') id: string, @Auth() auth: IAuth) {
    return this.deleteAttachmentHandler.execute(
      new DeleteAttachmentCommand(id, auth.id),
    );
  }
}
