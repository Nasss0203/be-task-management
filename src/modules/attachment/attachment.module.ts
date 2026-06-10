import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterConfigService } from 'src/config/multer.config';
import { ActivityModule } from '../activity/activity.module';
import { StorageModule } from '../storage/storage.module';

import { AttachmentController } from './controller/attachment.controller';
import { Attachment } from './domain/entities/attachment.entity';
import { ATTACHMENT_TYPES } from './interfaces/types';

import { UploadAttachmentRepositoryImpl } from './repositories/upload-attachment.repository';
import { FindAttachmentRepositoryImpl } from './repositories/find-attachment.repository';
import { UpdateAttachmentRepositoryImpl } from './repositories/update-attachment.repository';
import { DeleteAttachmentRepositoryImpl } from './repositories/delete-attachment.repository';

import { AttachmentFileValidatorServiceImpl } from './services/attachment-file-validator.service';
import { AttachmentStorageRouterServiceImpl } from './services/attachment-storage-router.service';

import { UploadAttachmentServiceImpl } from './services/upload-attachment.service';
import { UpdateAttachmentServiceImpl } from './services/update-attachment.service';
import { FindAttachmentServiceImpl } from './services/find-attachment.service';
import { DeleteAttachmentServiceImpl } from './services/delete-attachment.service';
import { CreateAttachmentDownloadUrlServiceImpl } from './services/create-attachment-download-url.service';

import { UploadAttachmentApplicationImpl } from './applications/upload-attachment.application';
import { UpdateAttachmentApplicationImpl } from './applications/update-attachment.application';
import { FindAttachmentApplicationImpl } from './applications/find-attachment.application';
import { DeleteAttachmentApplicationImpl } from './applications/delete-attachment.application';
import { CreateAttachmentDownloadUrlApplicationImpl } from './applications/create-attachment-download-url.application';

const repositories = [
  {
    provide: ATTACHMENT_TYPES.repositories.UploadAttachmentRepository,
    useClass: UploadAttachmentRepositoryImpl,
  },
  {
    provide: ATTACHMENT_TYPES.repositories.FindAttachmentRepository,
    useClass: FindAttachmentRepositoryImpl,
  },
  {
    provide: ATTACHMENT_TYPES.repositories.UpdateAttachmentRepository,
    useClass: UpdateAttachmentRepositoryImpl,
  },
  {
    provide: ATTACHMENT_TYPES.repositories.DeleteAttachmentRepository,
    useClass: DeleteAttachmentRepositoryImpl,
  },
];

const services = [
  {
    provide: ATTACHMENT_TYPES.services.AttachmentFileValidatorService,
    useClass: AttachmentFileValidatorServiceImpl,
  },
  {
    provide: ATTACHMENT_TYPES.services.AttachmentStorageRouterService,
    useClass: AttachmentStorageRouterServiceImpl,
  },
  {
    provide: ATTACHMENT_TYPES.services.UploadAttachmentService,
    useClass: UploadAttachmentServiceImpl,
  },
  {
    provide: ATTACHMENT_TYPES.services.UpdateAttachmentService,
    useClass: UpdateAttachmentServiceImpl,
  },
  {
    provide: ATTACHMENT_TYPES.services.FindAttachmentService,
    useClass: FindAttachmentServiceImpl,
  },
  {
    provide: ATTACHMENT_TYPES.services.DeleteAttachmentService,
    useClass: DeleteAttachmentServiceImpl,
  },
  {
    provide: ATTACHMENT_TYPES.services.CreateAttachmentDownloadUrlService,
    useClass: CreateAttachmentDownloadUrlServiceImpl,
  },
];

const applications = [
  {
    provide: ATTACHMENT_TYPES.applications.UploadAttachmentApplication,
    useClass: UploadAttachmentApplicationImpl,
  },
  {
    provide: ATTACHMENT_TYPES.applications.UpdateAttachmentApplication,
    useClass: UpdateAttachmentApplicationImpl,
  },
  {
    provide: ATTACHMENT_TYPES.applications.FindAttachmentApplication,
    useClass: FindAttachmentApplicationImpl,
  },
  {
    provide: ATTACHMENT_TYPES.applications.DeleteAttachmentApplication,
    useClass: DeleteAttachmentApplicationImpl,
  },
  {
    provide: ATTACHMENT_TYPES.applications.CreateAttachmentDownloadUrlApplication,
    useClass: CreateAttachmentDownloadUrlApplicationImpl,
  },
];

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
    TypeOrmModule.forFeature([Attachment]),
    ActivityModule,
    StorageModule,
  ],
  controllers: [AttachmentController],
  providers: [...repositories, ...services, ...applications, MulterConfigService],
  exports: [...applications],
})
export class AttachmentModule {}
