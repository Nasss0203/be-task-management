import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterConfigService } from 'src/config/multer.config';
import { StorageInfrastructureModule } from 'src/shared/infrastructure/storage/storage.module';
import { ActivityModule } from '../activity/activity.module';
import { DeleteAttachmentHandler } from './application/commands/delete-attachment/delete-attachment.handler';
import { UpdateAttachmentHandler } from './application/commands/update-attachment/update-attachment.handler';
import { UploadAttachmentHandler } from './application/commands/upload-attachment/upload-attachment.handler';
import { CreateAttachmentDownloadUrlHandler } from './application/queries/create-attachment-download-url/create-attachment-download-url.handler';
import { GetAttachmentsByTaskHandler } from './application/queries/get-attachments-by-task/get-attachments-by-task.handler';
import { ATTACHMENT_TOKENS } from './attachment.tokens';
import { AttachmentOrmEntity } from './infrastructure/persistence/typeorm/entities/attachment.orm-entity';
import { TypeOrmAttachmentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-attachment.repository';
import { AttachmentStorageRouterAdapter } from './infrastructure/storage/attachment-storage-router.adapter';
import { CloudinaryAttachmentStorageAdapter } from './infrastructure/storage/cloudinary-attachment-storage.adapter';
import { R2AttachmentStorageAdapter } from './infrastructure/storage/r2-attachment-storage.adapter';
import { AttachmentFileValidatorAdapter } from './infrastructure/validation/attachment-file-validator.adapter';
import { AttachmentController } from './presentation/http/controllers/attachment.controller';

const handlers = [
  UploadAttachmentHandler,
  GetAttachmentsByTaskHandler,
  CreateAttachmentDownloadUrlHandler,
  UpdateAttachmentHandler,
  DeleteAttachmentHandler,
];

@Module({
  imports: [
    MulterModule.registerAsync({ useClass: MulterConfigService }),
    TypeOrmModule.forFeature([AttachmentOrmEntity]),
    ActivityModule,
    StorageInfrastructureModule,
  ],
  controllers: [AttachmentController],
  providers: [
    {
      provide: ATTACHMENT_TOKENS.repository,
      useClass: TypeOrmAttachmentRepository,
    },
    {
      provide: ATTACHMENT_TOKENS.storage,
      useClass: AttachmentStorageRouterAdapter,
    },
    {
      provide: ATTACHMENT_TOKENS.fileValidator,
      useClass: AttachmentFileValidatorAdapter,
    },

    CloudinaryAttachmentStorageAdapter,
    R2AttachmentStorageAdapter,
    ...handlers,
    MulterConfigService,
  ],
  exports: [...handlers],
})
export class AttachmentModule {}
