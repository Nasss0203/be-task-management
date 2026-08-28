import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import type {
  AttachmentStorageUploadResult,
  UploadAttachmentStorageInput,
} from '../../application/ports/attachment-storage.port';

import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';

@Injectable()
export class CloudinaryAttachmentStorageAdapter {
  constructor(private readonly configService: ConfigService) {
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

  upload(
    input: UploadAttachmentStorageInput,
  ): Promise<AttachmentStorageUploadResult> {
    return new Promise((resolve, reject) => {
      let folder = `workspaces/${input.workspaceId}`;

      if (input.taskId) {
        folder += `/tasks/${input.taskId}`;
      } else if (input.commentId) {
        folder += `/comments/${input.commentId}`;
      } else if (input.pageBlockId) {
        folder += `/page-blocks/${input.pageBlockId}`;
      } else {
        folder += '/files';
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            return reject(new Error(error.message));
          }

          resolve({
            provider: AttachmentProvider.CLOUDINARY,
            storageKey: null,
            publicId: result!.public_id,
            url: result!.url,
            secureUrl: result!.secure_url,
          });
        },
      );

      uploadStream.end(input.buffer);
    });
  }
}
