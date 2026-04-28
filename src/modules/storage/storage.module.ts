import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { R2_CLIENT } from './constant/r2.constants';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [
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
  exports: [StorageService],
})
export class StorageModule {}
