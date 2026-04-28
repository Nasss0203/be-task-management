import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterConfigService } from 'src/config/multer.config';
import { StorageModule } from '../storage/storage.module';
import { AttachmentController } from './attachment.controller';
import { AttachmentsService } from './attachment.service';
import { Attachment } from './entities/attachment.entity';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService,
    }),
    TypeOrmModule.forFeature([Attachment]),
    StorageModule,
  ],
  controllers: [AttachmentController],
  providers: [AttachmentsService, MulterConfigService],
  exports: [AttachmentsService],
})
export class AttachmentModule {}
