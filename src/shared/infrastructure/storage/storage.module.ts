import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AwsS3StorageService } from './aws-s3-storage.service';
import { R2_CLIENT } from './constants/r2.constants';
import { StorageService } from './storage.service';
import { STORAGE_TYPES } from './storage.types';

@Module({
  imports: [ConfigModule],

  providers: [
    AwsS3StorageService,
    {
      provide: STORAGE_TYPES.ObjectStorage,
      useExisting: AwsS3StorageService,
    },

    StorageService,

    {
      provide: R2_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          region: 'auto',
          endpoint: configService.getOrThrow<string>('R2_ENDPOINT'),
          credentials: {
            accessKeyId: configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow<string>(
              'R2_SECRET_ACCESS_KEY',
            ),
          },
        });
      },
    },
  ],

  exports: [StorageService, STORAGE_TYPES.ObjectStorage, AwsS3StorageService],
})
export class StorageInfrastructureModule {}
