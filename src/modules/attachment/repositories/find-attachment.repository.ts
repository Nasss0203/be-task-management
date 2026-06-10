import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Attachment,
  AttachmentStatus,
} from '../domain/entities/attachment.entity';
import { AttachmentMapper } from '../mapper/attachment.mapper';
import { FindAttachmentRepository } from '../interfaces/repositories/find-attachment.repository.interface';

@Injectable()
export class FindAttachmentRepositoryImpl implements FindAttachmentRepository {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  async findReadyById(id: string) {
    const entity = await this.repo.findOne({
      where: {
        id,
        status: AttachmentStatus.READY,
      },
    });

    return entity ? AttachmentMapper.toModel(entity) : null;
  }

  async findByTask(taskId: string) {
    const entities = await this.repo.find({
      where: {
        taskId,
        status: AttachmentStatus.READY,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return entities.map(AttachmentMapper.toModel);
  }
}
