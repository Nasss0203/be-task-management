import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, In, Repository } from 'typeorm';
import { Mention } from '../../../../domain/entities/mention.entity';
import { MentionSourceType } from '../../../../domain/enums/mention-source-type.enum';
import { MentionRepository } from '../../../../domain/repositories/mention.repository';
import { MentionOrmEntity } from '../entities/mention.orm-entity';
import { MentionMapper } from '../mappers/mention.mapper';

@Injectable()
export class TypeOrmMentionRepository implements MentionRepository {
  constructor(
    @InjectRepository(MentionOrmEntity)
    private readonly repo: Repository<MentionOrmEntity>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<MentionOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(MentionOrmEntity)
      : this.repo;
  }

  async saveMany(
    mentions: Mention[],
    context?: PersistenceContext,
  ): Promise<void> {
    if (mentions.length === 0) return;

    await this.getRepo(context).save(
      mentions.map((mention) => MentionMapper.toOrm(mention)),
    );
  }

  async findBySource(
    sourceType: MentionSourceType,
    sourceId: string,
    context?: PersistenceContext,
  ): Promise<Mention[]> {
    const rows = await this.getRepo(context).find({
      where: { sourceType, sourceId },
    });

    return rows.map((row) => MentionMapper.toDomain(row));
  }

  async deleteByIds(
    ids: string[],
    context?: PersistenceContext,
  ): Promise<void> {
    if (ids.length === 0) return;

    await this.getRepo(context).delete({ id: In(ids) });
  }

  async deleteBySources(
    sourceType: MentionSourceType,
    sourceIds: string[],
    context?: PersistenceContext,
  ): Promise<void> {
    if (sourceIds.length === 0) return;

    await this.getRepo(context).delete({ sourceType, sourceId: In(sourceIds) });
  }
}
