import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterConfigService } from 'src/config/multer.config';
import { DatabaseModule } from 'src/database/database.module';
import { BillingModule } from 'src/modules/billing/billing.module';
import { StorageInfrastructureModule } from 'src/shared/infrastructure/storage/storage.module';
import { ActivityModule } from '../activity/activity.module';
import { CommentsModule } from '../comments/comments.module';
import { ContentModule } from '../content/content.module';
import { PermissionModule } from '../permission/permission.module';
import { BulkDeleteWorkspaceFilesHandler } from './application/commands/bulk-delete-workspace-files/bulk-delete-workspace-files.handler';
import { DeleteAttachmentHandler } from './application/commands/delete-attachment/delete-attachment.handler';
import { UpdateAttachmentHandler } from './application/commands/update-attachment/update-attachment.handler';
import { UploadAttachmentHandler } from './application/commands/upload-attachment/upload-attachment.handler';
import { CreateAttachmentDownloadUrlHandler } from './application/queries/create-attachment-download-url/create-attachment-download-url.handler';
import { CreatePublicSiteAttachmentDownloadUrlHandler } from './application/queries/create-public-site-attachment-download-url/create-public-site-attachment-download-url.handler';
import { GetWorkspaceStorageHandler } from './application/queries/get-workspace-storage/get-workspace-storage.handler';
import { ListWorkspaceStorageFilesHandler } from './application/queries/list-workspace-storage-files/list-workspace-storage-files.handler';
import { ATTACHMENT_TOKENS } from './attachment.tokens';
import { SqlWorkspaceStorageReader } from './infrastructure/persistence/typeorm/adapters/sql-workspace-storage-reader.adapter';
import { AttachmentOrmEntity } from './infrastructure/persistence/typeorm/entities/attachment.orm-entity';
import { TypeOrmAttachmentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-attachment.repository';
import { AttachmentStorageRouterAdapter } from './infrastructure/storage/attachment-storage-router.adapter';
import { R2AttachmentStorageAdapter } from './infrastructure/storage/r2-attachment-storage.adapter';
import { S3AttachmentStorageAdapter } from './infrastructure/storage/s3-attachment-storage.adapter';
import { AttachmentFileValidatorAdapter } from './infrastructure/validation/attachment-file-validator.adapter';
import { AttachmentController } from './presentation/http/controllers/attachment.controller';
import { PublicSiteAttachmentController } from './presentation/http/controllers/public-site-attachment.controller';

const handlers = [
  UploadAttachmentHandler,
  CreateAttachmentDownloadUrlHandler,
  CreatePublicSiteAttachmentDownloadUrlHandler,
  UpdateAttachmentHandler,
  DeleteAttachmentHandler,
  GetWorkspaceStorageHandler,
  ListWorkspaceStorageFilesHandler,
  BulkDeleteWorkspaceFilesHandler,
];

@Module({
  imports: [
    MulterModule.registerAsync({ useClass: MulterConfigService }),
    TypeOrmModule.forFeature([AttachmentOrmEntity]),
    ActivityModule,
    CommentsModule,
    ContentModule,
    PermissionModule,
    StorageInfrastructureModule,
    DatabaseModule,
    BillingModule,
  ],
  controllers: [AttachmentController, PublicSiteAttachmentController],
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
    {
      provide: ATTACHMENT_TOKENS.storageReader,
      useClass: SqlWorkspaceStorageReader,
    },

    R2AttachmentStorageAdapter,
    S3AttachmentStorageAdapter,
    ...handlers,
    MulterConfigService,
  ],
  exports: [...handlers],
})
export class AttachmentModule {}
