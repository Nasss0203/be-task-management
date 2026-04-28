// src/modules/attachments/attachments.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { extname } from 'path';
import { Repository } from 'typeorm';
import { StorageService } from '../storage/storage.service';

import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from './constants/attachment-file.constants';
import { UploadAttachmentDto } from './dto/create-attachment.dto';
import { Attachment, AttachmentStatus } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,

    private readonly storageService: StorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    body: UploadAttachmentDto,
    userId: string,
  ) {
    if (!body.taskId && !body.commentId) {
      throw new BadRequestException('taskId or commentId is required');
    }

    /**
     * TODO:
     * Check quyền ở đây:
     * - user có thuộc workspace không
     * - user có quyền xem task/comment không
     */

    const ext = this.validateExtension(file.originalname);
    const mimeType = await this.validateRealFileType(file, ext);

    const storageKey = this.storageService.buildStorageKey({
      workspaceId: body.workspaceId,
      taskId: body.taskId,
      commentId: body.commentId,
      fileName: file.originalname,
    });

    await this.storageService.uploadBuffer({
      key: storageKey,
      buffer: file.buffer,
      contentType: mimeType,
      metadata: {
        uploadedBy: userId,
        originalName: encodeURIComponent(file.originalname),
      },
    });

    const attachment = this.attachmentRepo.create({
      workspaceId: body.workspaceId,
      taskId: body.taskId ?? null,
      commentId: body.commentId ?? null,
      uploadedBy: userId,
      fileName: file.originalname,
      mimeType,
      size: file.size,
      storageKey,
      status: AttachmentStatus.READY,
    });

    const saved = await this.attachmentRepo.save(attachment);

    return {
      id: saved.id,
      workspaceId: saved.workspaceId,
      taskId: saved.taskId,
      commentId: saved.commentId,
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      size: saved.size,
      storageKey: saved.storageKey,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  async findByTask(taskId: string) {
    return this.attachmentRepo.find({
      where: {
        taskId,
        status: AttachmentStatus.READY,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async createDownloadUrl(attachmentId: string, userId: string) {
    const attachment = await this.attachmentRepo.findOne({
      where: {
        id: attachmentId,
        status: AttachmentStatus.READY,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    /**
     * TODO:
     * Check quyền download:
     * - user có thuộc workspace không
     * - user có quyền xem task/comment không
     */

    const result = await this.storageService.createDownloadUrl({
      key: attachment.storageKey as string,

      fileName: attachment.fileName,
    });

    return {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      downloadUrl: result.downloadUrl,
      expiresIn: result.expiresIn,
    };
  }

  private validateExtension(fileName: string) {
    const ext = extname(fileName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File extension ${ext} is not allowed`);
    }

    return ext;
  }

  private async validateRealFileType(
    file: Express.Multer.File,
    ext: string,
  ): Promise<string> {
    const { fileTypeFromBuffer } = await import('file-type');

    const detected = await fileTypeFromBuffer(file.buffer);

    /**
     * Một số file text như txt/csv không có magic bytes rõ ràng,
     * nên file-type có thể trả về undefined.
     */
    if (!detected) {
      if (ext === '.txt' && file.mimetype === 'text/plain') {
        return 'text/plain';
      }

      if (
        ext === '.csv' &&
        ['text/csv', 'text/plain'].includes(file.mimetype)
      ) {
        return 'text/csv';
      }

      /**
       * File Figma .fig có thể được gửi là application/octet-stream.
       * Không thể xác minh chắc 100% bằng MIME, nên chỉ cho qua khi extension là .fig.
       */
      if (ext === '.fig' && file.mimetype === 'application/octet-stream') {
        return 'application/octet-stream';
      }

      throw new BadRequestException('Cannot detect file type');
    }

    const detectedMime = detected.mime;

    /**
     * docx/xlsx/pptx là định dạng zip-based.
     * Có môi trường detect ra đúng Office MIME, có môi trường detect ra application/zip.
     */
    const officeExtensions = ['.docx', '.xlsx', '.pptx'];
    const isOfficeZip =
      officeExtensions.includes(ext) && detectedMime === 'application/zip';

    const isAllowedMime = ALLOWED_MIME_TYPES.includes(detectedMime);

    if (!isAllowedMime && !isOfficeZip) {
      throw new BadRequestException(`File type ${detectedMime} is not allowed`);
    }

    if (isOfficeZip) {
      if (ext === '.docx') {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      if (ext === '.xlsx') {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      if (ext === '.pptx') {
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      }
    }

    /**
     * Chặn trường hợp file .exe đổi tên thành .png.
     * Ví dụ: extension .png nhưng detected MIME không phải image/png.
     */
    const expectedByExt: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.svg': ['image/svg+xml'],
      '.pdf': ['application/pdf'],
      '.zip': ['application/zip', 'application/x-zip-compressed'],
      '.doc': ['application/msword'],
      '.xls': ['application/vnd.ms-excel'],
      '.ppt': ['application/vnd.ms-powerpoint'],
    };

    const expectedMimes = expectedByExt[ext];

    if (expectedMimes && !expectedMimes.includes(detectedMime)) {
      throw new BadRequestException(
        `Invalid file content. Extension ${ext} does not match ${detectedMime}`,
      );
    }

    return detectedMime;
  }
}
