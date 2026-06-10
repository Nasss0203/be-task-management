import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../domain/entities/attachment.entity';
import { DeleteAttachmentRepository } from '../interfaces/repositories/delete-attachment.repository.interface';

@Injectable()
export class DeleteAttachmentRepositoryImpl implements DeleteAttachmentRepository {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
