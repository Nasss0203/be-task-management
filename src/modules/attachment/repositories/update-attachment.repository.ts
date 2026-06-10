import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../domain/entities/attachment.entity';
import { AttachmentMapper } from '../mapper/attachment.mapper';
import { UpdateAttachmentRepository } from '../interfaces/repositories/update-attachment.repository.interface';
import { SaveAttachmentInput } from '../interfaces/repositories/attachment.repository.interface';

@Injectable()
export class UpdateAttachmentRepositoryImpl implements UpdateAttachmentRepository {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  async update(input: SaveAttachmentInput) {
    const entity = AttachmentMapper.toEntity(input);
    const saved = await this.repo.save(entity);

    return AttachmentMapper.toModel(saved);
  }
}
