import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, In, Repository } from 'typeorm';
import { AttachmentAggregate } from '../../../../domain/aggregates/attachment.aggregate';
import { AttachmentStatus } from '../../../../domain/enums/attachment-status.enum';
import type { AttachmentRepository } from '../../../../domain/repositories/attachment.repository';
import { AttachmentOrmEntity } from '../entities/attachment.orm-entity';
import { AttachmentPersistenceMapper } from '../mappers/attachment.persistence-mapper';

@Injectable()
export class TypeOrmAttachmentRepository implements AttachmentRepository {
  constructor(
    @InjectRepository(AttachmentOrmEntity)
    private readonly repository: Repository<AttachmentOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<AttachmentOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(AttachmentOrmEntity)
      : this.repository;
  }

  async save(
    attachment: AttachmentAggregate,
    context?: PersistenceContext,
  ): Promise<AttachmentAggregate> {
    const repository = this.getRepository(context);
    const saved = await repository.save(
      AttachmentPersistenceMapper.toOrm(attachment),
    );

    return AttachmentPersistenceMapper.toDomain(saved);
  }

  async findReadyById(
    id: string,
    context?: PersistenceContext,
  ): Promise<AttachmentAggregate | null> {
    const entity = await this.getRepository(context).findOne({
      where: { id, status: AttachmentStatus.READY },
    });

    return entity ? AttachmentPersistenceMapper.toDomain(entity) : null;
  }

  async findReadyByIds(
    ids: string[],
    context?: PersistenceContext,
  ): Promise<AttachmentAggregate[]> {
    if (!ids.length) {
      return [];
    }

    const entities = await this.getRepository(context).find({
      where: { id: In(ids), status: AttachmentStatus.READY },
    });

    return entities.map((entity) =>
      AttachmentPersistenceMapper.toDomain(entity),
    );
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    await this.getRepository(context).delete(id);
  }

  async deleteByIds(
    ids: string[],
    context?: PersistenceContext,
  ): Promise<void> {
    if (!ids.length) {
      return;
    }

    await this.getRepository(context).delete({ id: In(ids) });
  }
}
