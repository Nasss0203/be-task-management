import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PagePublication } from 'src/modules/content/domain/entities/page-publication.entity';
import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import { PagePublicationPath } from 'src/modules/content/domain/value-objects/page-publication-path.vo';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { PagePublicationOrmEntity } from '../entities/page-publication.orm-entity';
import { PagePublicationMapper } from '../mappers/page-publication.mapper';

@Injectable()
export class TypeOrmPagePublicationRepository implements PagePublicationRepository {
  constructor(
    @InjectRepository(PagePublicationOrmEntity)
    private readonly repo: Repository<PagePublicationOrmEntity>,
  ) {}

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<PagePublicationOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(PagePublicationOrmEntity)
      : this.repo;
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PagePublication | null> {
    const orm = await this.resolveRepo(context).findOne({ where: { id } });
    return orm ? PagePublicationMapper.toDomain(orm) : null;
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PagePublication[]> {
    const orms = await this.resolveRepo(context).find({
      where: { page_id: pageId },
      order: { published_at: 'ASC' },
    });
    return orms.map(PagePublicationMapper.toDomain);
  }

  async findBySiteAndPage(
    siteId: string,
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PagePublication | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { site_id: siteId, page_id: pageId },
    });
    return orm ? PagePublicationMapper.toDomain(orm) : null;
  }

  async findActiveBySiteAndPath(
    siteId: string,
    path: string,
    context?: PersistenceContext,
  ): Promise<PagePublication | null> {
    const normalized = PagePublicationPath.create(path).getValue();
    const orm = await this.resolveRepo(context).findOne({
      where: {
        site_id: siteId,
        path: normalized,
        unpublished_at: IsNull(),
      },
    });
    return orm ? PagePublicationMapper.toDomain(orm) : null;
  }

  async findBySiteId(
    siteId: string,
    context?: PersistenceContext,
  ): Promise<PagePublication[]> {
    const orms = await this.resolveRepo(context).find({
      where: { site_id: siteId },
      order: { published_at: 'ASC' },
    });
    return orms.map(PagePublicationMapper.toDomain);
  }

  async save(
    publication: PagePublication,
    context?: PersistenceContext,
  ): Promise<PagePublication> {
    const saved = await this.resolveRepo(context).save(
      PagePublicationMapper.toOrm(publication),
    );
    return PagePublicationMapper.toDomain(saved);
  }
}
