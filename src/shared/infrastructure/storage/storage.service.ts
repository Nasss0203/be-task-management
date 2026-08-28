import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { R2_CLIENT } from './constants/r2.constants';

@Injectable()
export class StorageService {
  private readonly bucketName: string;

  constructor(
    @Inject(R2_CLIENT)
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
  }

  async uploadBuffer(input: {
    key: string;
    buffer: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
  }) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.contentType,
        Metadata: input.metadata,
      }),
    );

    return {
      key: input.key,
    };
  }

  async createDownloadUrl(input: {
    key: string;
    fileName?: string;
    contentType?: string;
    expiresIn?: number;
  }) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: input.key,
      ResponseContentType: input.contentType,
      ResponseContentDisposition: input.fileName
        ? `inline; filename="${encodeURIComponent(input.fileName)}"`
        : 'inline',
    });

    const downloadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: input.expiresIn ?? 60 * 5,
    });

    return {
      downloadUrl,
      expiresIn: input.expiresIn ?? 300,
    };
  }

  async deleteFile(key: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    return {
      deleted: true,
      key,
    };
  }

  buildStorageKey(input: {
    workspaceId: string;
    taskId?: string;
    commentId?: string;
    pageBlockId?: string;
    fileName: string;
  }) {
    const ext = extname(input.fileName).toLowerCase();

    const safeName = input.fileName
      .replace(ext, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .toLowerCase();

    const id = randomUUID();

    if (input.taskId) {
      return `workspaces/${input.workspaceId}/tasks/${input.taskId}/${id}-${safeName}${ext}`;
    }

    if (input.commentId) {
      return `workspaces/${input.workspaceId}/comments/${input.commentId}/${id}-${safeName}${ext}`;
    }

    if (input.pageBlockId) {
      return `workspaces/${input.workspaceId}/page-blocks/${input.pageBlockId}/${id}-${safeName}${ext}`;
    }

    return `workspaces/${input.workspaceId}/files/${id}-${safeName}${ext}`;
  }
}
