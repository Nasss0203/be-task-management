import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageShareLink } from '../../../../domain/entities/page-share-link.entity';
import type { PageShareLinkRepository } from '../../../../domain/repositories/page-share-link.repository';

import { PageShareLinkOrmEntity } from '../entities/page-share-link.orm-entity';
import { PageShareLinkMapper } from '../mappers/page-share-link.mapper';

@Injectable()
export class TypeOrmPageShareLinkRepository implements PageShareLinkRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepository(
    context?: PersistenceContext,
  ): Repository<PageShareLinkOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(PageShareLinkOrmEntity);
    }

    return this.dataSource.getRepository(PageShareLinkOrmEntity);
  }

  async save(
    shareLink: PageShareLink,
    context?: PersistenceContext,
  ): Promise<PageShareLink> {
    const repository = this.resolveRepository(context);

    const orm = PageShareLinkMapper.toOrm(shareLink);

    const saved = await repository.save(orm);

    return PageShareLinkMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageShareLink | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        id,
      },
    });

    return orm ? PageShareLinkMapper.toDomain(orm) : null;
  }

  async findByTokenHash(
    tokenHash: string,
    context?: PersistenceContext,
  ): Promise<PageShareLink | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        token_hash: tokenHash,
      },
    });

    return orm ? PageShareLinkMapper.toDomain(orm) : null;
  }

  async findActiveByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShareLink | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        page_id: pageId,
        revoked_at: IsNull(),
      },
      order: {
        created_at: 'DESC',
      },
    });

    return orm ? PageShareLinkMapper.toDomain(orm) : null;
  }
}
