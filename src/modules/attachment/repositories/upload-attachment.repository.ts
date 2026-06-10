import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../domain/entities/attachment.entity';
import { AttachmentMapper } from '../mapper/attachment.mapper';
import { UploadAttachmentRepository } from '../interfaces/repositories/upload-attachment.repository.interface';
import { SaveAttachmentInput } from '../interfaces/repositories/attachment.repository.interface';

@Injectable()
export class UploadAttachmentRepositoryImpl implements UploadAttachmentRepository {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  async save(input: SaveAttachmentInput) {
    const entity = AttachmentMapper.toEntity(input);
    const saved = await this.repo.save(entity);

    return AttachmentMapper.toModel(saved);
  }
}
