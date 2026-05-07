import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { AttachmentsService } from './attachment.service';
import {
  ALLOWED_FILE_MIME_REGEX,
  MAX_ATTACHMENT_SIZE,
} from './constants/attachment-file.constants';
import { UploadAttachmentDto } from './dto/create-attachment.dto';

@Controller('attachment')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentsService) {}

  @Post('upload')
  @ResponseMessage('Upload file with R2')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_ATTACHMENT_SIZE,
      },
    }),
  )
  async upload(
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
    console.log('Body', body);
    const userId = auth.id;

    return this.attachmentService.upload(file, body, userId);
  }

  @Get('tasks/:taskId')
  async findByTask(@Param('taskId') taskId: string) {
    return this.attachmentService.findByTask(taskId);
  }

  @Post(':id/download-url')
  @ResponseMessage('Get URL file')
  async createDownloadUrl(@Param('id') id: string, @Auth() auth: IAuth) {
    const userId = auth.id;

    return this.attachmentService.createDownloadUrl(id, userId);
  }
}
