import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplateEntitlement } from '../../../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import type { TemplateEntitlementRepository } from '../../../../domain/repositories/template-entitlement.repository';
import { TemplateEntitlementOrmEntity } from '../entities/template-entitlement.orm-entity';
import { TemplateEntitlementMapper } from '../mappers/template-entitlement.mapper';
import type {
  ClaimedTemplateReadModel,
  FindClaimedTemplatesFilters,
  FindClaimedTemplatesResult,
} from '../../../../domain/repositories/claimed-template.read-model';
import { TemplateVisibility } from '../../../../../template/domain/enums/template-visibility.enum';
import { TemplateVersionStatus } from '../../../../../template/domain/enums/template-version-status.enum';
import { PageTemplateVersionOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';

@Injectable()
export class TypeOrmTemplateEntitlementRepository implements TemplateEntitlementRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    entitlement: TemplateEntitlement,
    context?: PersistenceContext,
  ): Promise<TemplateEntitlement> {
    const repository = this.getRepo(context);
    const saved = await repository.save(
      TemplateEntitlementMapper.toOrm(entitlement),
    );

    return TemplateEntitlementMapper.toDomain(saved);
  }

  async findByTemplateAndUser(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<TemplateEntitlement | null> {
    const repository = this.getRepo(context);
    const entity = await repository.findOne({
      where: { templateId, userId },
    });

    return entity ? TemplateEntitlementMapper.toDomain(entity) : null;
  }

  async findClaimedByUser(
    filters: FindClaimedTemplatesFilters,
    context?: PersistenceContext,
  ): Promise<FindClaimedTemplatesResult> {
    const qb = this.getRepo(context).createQueryBuilder('entitlement');
    // A correlated selection inside one SQL statement, not a query per item.
    const legacyVersion = qb
      .subQuery()
      .select('fallback.id')
      .from(PageTemplateVersionOrmEntity, 'fallback')
      .where('fallback.templateId = template.id')
      .andWhere('fallback.status = :publishedStatus')
      .orderBy('fallback.versionNumber', 'DESC')
      .addOrderBy('fallback.id', 'DESC')
      .limit(1)
      .getQuery();
    qb.innerJoin('entitlement.template', 'template')
      .leftJoin(
        TemplateListingOrmEntity,
        'listing',
        'listing.templateId = template.id',
      )
      .leftJoin(
        PageTemplateVersionOrmEntity,
        'version',
        `version.id = COALESCE(listing.publishedVersionId, ${legacyVersion})
         AND version.templateId = "template"."id"
         AND version.status = :publishedStatus
         AND template.visibility = :publicVisibility`,
      )
      .select('entitlement.id', 'entitlementId')
      .addSelect('entitlement.templateId', 'templateId')
      .addSelect('entitlement.source', 'source')
      .addSelect('entitlement.createdAt', 'claimedAt')
      .addSelect('template.visibility', 'visibility')
      .addSelect('template.status', 'status')
      .addSelect('listing.status', 'listingStatus')
      .addSelect('version.id', 'versionId')
      .addSelect('version.templateId', 'versionTemplateId')
      .addSelect('version.versionNumber', 'versionNumber')
      .addSelect('version.status', 'versionStatus')
      .addSelect('version.publishedAt', 'versionPublishedAt')
      .where('entitlement.userId = :userId', { userId: filters.userId })
      .setParameters({
        publicVisibility: TemplateVisibility.PUBLIC,
        publishedStatus: TemplateVersionStatus.PUBLISHED,
      });
    // Entitlement is not permission to read metadata after visibility changes.
    for (const field of ['name', 'description', 'icon', 'coverUrl']) {
      qb.addSelect(
        `CASE WHEN template.visibility = :publicVisibility THEN template.${field} ELSE NULL END`,
        field,
      );
    }
    if (filters.cursor) {
      qb.andWhere(
        new Brackets((cursorQb) => {
          cursorQb
            .where('entitlement.createdAt < :cursorCreatedAt')
            .orWhere(
              '(entitlement.createdAt = :cursorCreatedAt AND entitlement.id < :cursorId)',
            );
        }),
        {
          cursorCreatedAt: filters.cursor.createdAt,
          cursorId: filters.cursor.id,
        },
      );
    }
    // Unique (template_id, user_id) and unique listing/template prevent duplicates.
    const rows = await qb
      .orderBy('entitlement.createdAt', 'DESC')
      .addOrderBy('entitlement.id', 'DESC')
      .limit(filters.limit + 1)
      .getRawMany<
        Omit<ClaimedTemplateReadModel, 'publishedVersion'> & {
          versionId: string | null;
          versionTemplateId: string | null;
          versionNumber: number | null;
          versionStatus: TemplateVersionStatus | null;
          versionPublishedAt: Date | null;
        }
      >();
    return {
      hasNextPage: rows.length > filters.limit,
      items: rows.slice(0, filters.limit).map((row) => ({
        entitlementId: row.entitlementId,
        templateId: row.templateId,
        source: row.source,
        claimedAt: row.claimedAt,
        name: row.name,
        description: row.description,
        icon: row.icon,
        coverUrl: row.coverUrl,
        visibility: row.visibility,
        status: row.status,
        listingStatus: row.listingStatus,
        publishedVersion:
          row.versionId &&
          row.versionTemplateId === row.templateId &&
          row.versionStatus === TemplateVersionStatus.PUBLISHED &&
          row.versionNumber !== null
            ? {
                id: row.versionId,
                templateId: row.versionTemplateId,
                versionNumber: row.versionNumber,
                status: row.versionStatus,
                publishedAt: row.versionPublishedAt,
              }
            : null,
      })),
    };
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplateEntitlementOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(TemplateEntitlementOrmEntity)
      : this.dataSource.getRepository(TemplateEntitlementOrmEntity);
  }
}
