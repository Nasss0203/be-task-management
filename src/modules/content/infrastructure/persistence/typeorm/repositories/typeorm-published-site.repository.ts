import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PublishedSite } from 'src/modules/content/domain/entities/published-site.entity';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';
import { PublishedSiteSubdomain } from 'src/modules/content/domain/value-objects/published-site-subdomain.vo';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { PublishedSiteOrmEntity } from '../entities/published-site.orm-entity';
import { PublishedSiteMapper } from '../mappers/published-site.mapper';

@Injectable()
export class TypeOrmPublishedSiteRepository implements PublishedSiteRepository {
  constructor(
    @InjectRepository(PublishedSiteOrmEntity)
    private readonly repo: Repository<PublishedSiteOrmEntity>,
  ) {}

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<PublishedSiteOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(PublishedSiteOrmEntity)
      : this.repo;
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null> {
    const orm = await this.resolveRepo(context).findOne({ where: { id } });
    return orm ? PublishedSiteMapper.toDomain(orm) : null;
  }

  async findBySubdomain(
    subdomain: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null> {
    const normalized = PublishedSiteSubdomain.create(subdomain).getValue();
    const orm = await this.resolveRepo(context).findOne({
      where: { subdomain: normalized },
    });
    return orm ? PublishedSiteMapper.toDomain(orm) : null;
  }

  async findActiveBySubdomain(
    subdomain: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null> {
    const normalized = PublishedSiteSubdomain.create(subdomain).getValue();
    const orm = await this.resolveRepo(context).findOne({
      where: { subdomain: normalized, disabled_at: IsNull() },
    });
    return orm ? PublishedSiteMapper.toDomain(orm) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite[]> {
    const orms = await this.resolveRepo(context).find({
      where: { workspace_id: workspaceId },
      order: { created_at: 'ASC' },
    });
    return orms.map(PublishedSiteMapper.toDomain);
  }

  async findByRootPageId(
    rootPageId: string,
    context?: PersistenceContext,
  ): Promise<PublishedSite | null> {
    const entity = await this.resolveRepo(context).findOne({
      where: {
        root_page_id: rootPageId,
      },
    });

    return entity ? PublishedSiteMapper.toDomain(entity) : null;
  }

  async existsBySubdomain(
    subdomain: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const normalized = PublishedSiteSubdomain.create(subdomain).getValue();
    return this.resolveRepo(context).exists({
      where: { subdomain: normalized },
    });
  }

  async save(
    site: PublishedSite,
    context?: PersistenceContext,
  ): Promise<PublishedSite> {
    const saved = await this.resolveRepo(context).save(
      PublishedSiteMapper.toOrm(site),
    );
    return PublishedSiteMapper.toDomain(saved);
  }
}
