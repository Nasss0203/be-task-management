import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import type { AvatarStoragePort } from '../../application/ports/avatar-storage.port';

@Injectable()
export class CloudinaryAvatarStorageAdapter implements AvatarStoragePort {
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

  upload(userId: string, image: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: this.publicId(userId),
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(error?.message ?? 'Avatar upload failed'));
          }

          resolve(result.secure_url);
        },
      );

      uploadStream.end(image);
    });
  }

  async remove(userId: string): Promise<void> {
    await cloudinary.uploader.destroy(this.publicId(userId), {
      invalidate: true,
    });
  }

  private publicId(userId: string): string {
    return `users/${userId}/avatar`;
  }
}
