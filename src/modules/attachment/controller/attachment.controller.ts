import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Query,
  Patch,
  Delete,
  ParseFilePipeBuilder,
  Post,
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
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import {
  ALLOWED_FILE_MIME_REGEX,
  MAX_ATTACHMENT_SIZE,
} from '../constants/attachment-file.constants';
import { UploadAttachmentDto } from '../dto/create-attachment.dto';
import { UpdateAttachmentDto } from '../dto/update-attachment.dto';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import type { UploadAttachmentApplication } from '../interfaces/applications/upload-attachment.application.interface';
import type { FindAttachmentApplication } from '../interfaces/applications/find-attachment.application.interface';
import type { CreateAttachmentDownloadUrlApplication } from '../interfaces/applications/create-attachment-download-url.application.interface';
import type { UpdateAttachmentApplication } from '../interfaces/applications/update-attachment.application.interface';
import type { DeleteAttachmentApplication } from '../interfaces/applications/delete-attachment.application.interface';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

@Controller('attachment')
export class AttachmentController {
  constructor(
    @Inject(ATTACHMENT_TYPES.applications.UploadAttachmentApplication)
    private readonly uploadApp: UploadAttachmentApplication,
    @Inject(ATTACHMENT_TYPES.applications.FindAttachmentApplication)
    private readonly findApp: FindAttachmentApplication,
    @Inject(ATTACHMENT_TYPES.applications.CreateAttachmentDownloadUrlApplication)
    private readonly createDownloadUrlApp: CreateAttachmentDownloadUrlApplication,
    @Inject(ATTACHMENT_TYPES.applications.UpdateAttachmentApplication)
    private readonly updateApp: UpdateAttachmentApplication,
    @Inject(ATTACHMENT_TYPES.applications.DeleteAttachmentApplication)
    private readonly deleteApp: DeleteAttachmentApplication,
  ) { }

  @Post('upload/:workspaceId')
  @UploadRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_UPLOAD)
  @ResponseMessage('Upload file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_ATTACHMENT_SIZE,
      },
    }),
  )
  async upload(
    @Param('workspaceId') workspaceId: string,
    @Body() body: UploadAttachmentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: ALLOWED_FILE_MIME_REGEX,
        })
        .addMaxSizeValidator({
          maxSize: MAX_ATTACHMENT_SIZE,
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Auth() auth: IAuth,
  ) {
    const userId = auth.id;

    body.workspaceId = workspaceId;

    return this.uploadApp.execute(file, body, userId);
  }

  @Get('tasks/:taskId')
  @ReadRateLimit()
  async findByTask(@Param('taskId') taskId: string) {
    return this.findApp.findByTask(taskId);
  }

  @Post(':id/download-url')
  @WriteRateLimit()
  @ResponseMessage('Get URL file')
  async createDownloadUrl(@Param('id') id: string, @Auth() auth: IAuth) {
    const userId = auth.id;

    return this.createDownloadUrlApp.execute(id, userId);
  }

  @Patch(':id')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'attachment', key: 'id' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAttachmentDto,
    @Auth() auth: IAuth,
  ) {
    const userId = auth.id;
    return this.updateApp.execute(id, body, userId);
  }

  @Delete(':id')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'resource', type: 'attachment', key: 'id' })
  @RequirePermissions(PERMISSIONS.ATTACHMENT_DELETE)
  async delete(@Param('id') id: string, @Auth() auth: IAuth) {
    const userId = auth.id;
    return this.deleteApp.execute(id, userId);
  }
}
