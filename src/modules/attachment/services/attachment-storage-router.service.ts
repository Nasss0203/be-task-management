import { Injectable } from '@nestjs/common';
import { AttachmentStorageRouterService } from '../interfaces/services/attachment-storage-router.service.interface';
import { StorageService } from '../../storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class AttachmentStorageRouterServiceImpl implements AttachmentStorageRouterService {
  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  buildStorageKey(params: {
    workspaceId: string;
    taskId?: string | null;
    commentId?: string | null;
    fileName: string;
  }): string {
    return this.storageService.buildStorageKey({
      workspaceId: params.workspaceId,
      taskId: params.taskId ?? undefined,
      commentId: params.commentId ?? undefined,
      fileName: params.fileName,
    });
  }

  async uploadBuffer(params: {
    key: string;
    buffer: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<void> {
    await this.storageService.uploadBuffer(params);
  }

  async createDownloadUrl(params: {
    key: string;
    fileName: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }> {
    return this.storageService.createDownloadUrl(params);
  }

  async uploadToCloudinary(params: {
    buffer: Buffer;
    workspaceId: string;
    taskId?: string | null;
    commentId?: string | null;
    fileName: string;
  }): Promise<{ url: string; secureUrl: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      let folder = `workspaces/${params.workspaceId}`;
      if (params.taskId) {
        folder += `/tasks/${params.taskId}`;
      } else if (params.commentId) {
        folder += `/comments/${params.commentId}`;
      } else {
        folder += `/files`;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result!.url,
            secureUrl: result!.secure_url,
            publicId: result!.public_id,
          });
        },
      );

      uploadStream.end(params.buffer);
    });
  }
}
