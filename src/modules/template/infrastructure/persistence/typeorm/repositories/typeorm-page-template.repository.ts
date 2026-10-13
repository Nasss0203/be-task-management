import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateListingStatus } from '../../../../../marketplace/domain/enums/template-listing-status.enum';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVersionStatus } from '../../../../domain/enums/template-version-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type {
  FindPageTemplatesFilters,
  FindPageTemplatesResult,
  FindPublicPageTemplateByIdResult,
  PageTemplateRepository,
} from '../../../../domain/repositories/page-template.repository';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import { PageTemplateVersionOrmEntity } from '../entities/page-template-version.orm-entity';
import { TemplateListingOrmEntity } from '../../../../../marketplace/infrastructure/persistence/typeorm/entities/template-listing.orm-entity';
import { TemplateListingCategoryOrmEntity } from '../../../../../marketplace/infrastructure/persistence/typeorm/entities/template-listing-category.orm-entity';
import { PageTemplateOrmEntity } from '../entities/page-template.orm-entity';
import { PageTemplateMapper } from '../mappers/page-template.mapper';
import { TemplateVersionMapper } from '../mappers/template-version.mapper';

@Injectable()
export class TypeOrmPageTemplateRepository implements PageTemplateRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    template: PageTemplate,
    context?: PersistenceContext,
  ): Promise<PageTemplate> {
    return this.save(template, context);
  }

  async save(
    template: PageTemplate,
    context?: PersistenceContext,
  ): Promise<PageTemplate> {
    const repository = this.getRepo(context);

    const saved = await repository.save(PageTemplateMapper.toOrm(template));

    return PageTemplateMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { id },
    });

    return entity ? PageTemplateMapper.toDomain(entity) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: { workspaceId },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });

    return entities.map((entity) => PageTemplateMapper.toDomain(entity));
  }

  async findByCreatorId(
    createdBy: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate[]> {
    const repository = this.getRepo(context);

    const entities = await repository.find({
      where: { createdBy },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });

    return entities.map((entity) => PageTemplateMapper.toDomain(entity));
  }

  async findByIdForUpdate(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageTemplate | null> {
    const repository = this.getRepo(context);

    const entity = await repository
      .createQueryBuilder('template')
      .where('template.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();

    return entity ? PageTemplateMapper.toDomain(entity) : null;
  }

  async findMany(
    filters: FindPageTemplatesFilters,
    context?: PersistenceContext,
  ): Promise<FindPageTemplatesResult> {
    const repository = this.getRepo(context);
    const qb = repository.createQueryBuilder('template');

    if (filters.scope === TemplateListScope.MINE) {
      qb.where('template.createdBy = :userId', { userId: filters.userId });
      qb.andWhere('template.status != :archivedStatus', {
        archivedStatus: TemplateStatus.ARCHIVED,
      });
    } else if (filters.scope === TemplateListScope.WORKSPACE) {
      qb.where('template.workspaceId = :workspaceId', {
        workspaceId: filters.workspaceId,
      });
      qb.andWhere('template.status != :archivedStatus', {
        archivedStatus: TemplateStatus.ARCHIVED,
      });

      if (!filters.canManageWorkspace) {
        qb.andWhere(
          new Brackets((subQb) => {
            subQb
              .where('template.visibility IN (:...memberVisibilities)', {
                memberVisibilities: [
                  TemplateVisibility.WORKSPACE,
                  TemplateVisibility.PUBLIC,
                ],
              })
              .orWhere(
                new Brackets((privateQb) => {
                  privateQb
                    .where('template.visibility = :privateVisibility', {
                      privateVisibility: TemplateVisibility.PRIVATE,
                    })
                    .andWhere('template.createdBy = :userId', {
                      userId: filters.userId,
                    });
                }),
              );
          }),
        );
      }
    } else if (filters.scope === TemplateListScope.PUBLIC) {
      qb.where('template.visibility = :publicVisibility', {
        publicVisibility: TemplateVisibility.PUBLIC,
      });
      if (filters.requirePublishedVersion) {
        qb.andWhere('template.status != :archivedStatus', {
          archivedStatus: TemplateStatus.ARCHIVED,
        });
        // Filter before pagination so draft-only templates cannot consume a slot.
        qb.andWhere(
          (subQb) => {
            const publishedVersion = subQb
              .subQuery()
              .select('1')
              .from(PageTemplateVersionOrmEntity, 'publishedVersion')
              .where('publishedVersion.templateId = template.id')
              .andWhere('publishedVersion.status = :publishedVersionStatus')
              .getQuery();
            return 'EXISTS ' + publishedVersion;
          },
          { publishedVersionStatus: TemplateVersionStatus.PUBLISHED },
        );
        qb.andWhere(
          (subQb) => {
            const publishedListing = subQb
              .subQuery()
              .select('1')
              .from(TemplateListingOrmEntity, 'publishedListing')
              .where('publishedListing.templateId = template.id')
              .andWhere('publishedListing.status = :publishedListingStatus')
              .getQuery();
            return 'EXISTS ' + publishedListing;
          },
          { publishedListingStatus: TemplateListingStatus.PUBLISHED },
        );
      } else {
        qb.andWhere('template.status = :publishedStatus', {
          publishedStatus: TemplateStatus.PUBLISHED,
        });
      }
    }

    if (
      filters.scope === TemplateListScope.PUBLIC &&
      filters.categorySlug !== undefined
    ) {
      qb.andWhere(
        (subQb) => {
          const categoryListing = subQb
            .subQuery()
            .select('1')
            .from(TemplateListingCategoryOrmEntity, 'categoryAssociation')
            .innerJoin('categoryAssociation.listing', 'categoryListing')
            .innerJoin('categoryAssociation.category', 'filterCategory')
            .where('categoryListing.templateId = template.id')
            .andWhere('categoryListing.status = :categoryListingStatus')
            .andWhere('filterCategory.slug = :categorySlug')
            .andWhere('filterCategory.isActive = :categoryActive')
            .getQuery();
          return 'EXISTS ' + categoryListing;
        },
        {
          categoryListingStatus: TemplateListingStatus.PUBLISHED,
          categorySlug: filters.categorySlug,
          categoryActive: true,
        },
      );
    }

    if (filters.search) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('template.name ILIKE :search', {
              search: `%${filters.search}%`,
            })
            .orWhere('template.description ILIKE :search', {
              search: `%${filters.search}%`,
            });
        }),
      );
    }

    const cursor = filters.cursor;
    if (cursor) {
      qb.andWhere(
        new Brackets((cursorQb) => {
          cursorQb
            .where('template.createdAt < :cursorCreatedAt', {
              cursorCreatedAt: cursor.createdAt,
            })
            .orWhere(
              new Brackets((tieQb) => {
                tieQb
                  .where('template.createdAt = :cursorCreatedAt', {
                    cursorCreatedAt: cursor.createdAt,
                  })
                  .andWhere('template.id < :cursorId', {
                    cursorId: cursor.id,
                  });
              }),
            );
        }),
      );
    }

    qb.orderBy('template.createdAt', 'DESC')
      .addOrderBy('template.id', 'DESC')
      .take(filters.limit + 1);

    const rows = await qb.getMany();
    const hasNextPage = rows.length > filters.limit;
    const items = hasNextPage ? rows.slice(0, filters.limit) : rows;

    // One batch query for the page, selecting only the represented version.
    const versionQb = repository.manager
      .getRepository(PageTemplateVersionOrmEntity)
      .createQueryBuilder('version')
      .distinctOn(['version.templateId'])
      .where('version.templateId IN (:...templateIds)', {
        templateIds: items.map((item) => item.id),
      })
      .orderBy('version.templateId', 'ASC')
      .addOrderBy('version.versionNumber', 'DESC')
      .addOrderBy('version.id', 'DESC');

    if (filters.scope === TemplateListScope.PUBLIC) {
      versionQb
        .innerJoin(
          TemplateListingOrmEntity,
          'activeListing',
          'activeListing.templateId = version.templateId',
        )
        .andWhere(
          '(activeListing.publishedVersionId IS NULL OR version.id = activeListing.publishedVersionId)',
        );
      versionQb.andWhere('version.status = :versionStatus', {
        versionStatus: TemplateVersionStatus.PUBLISHED,
      });
    }

    const versions = items.length > 0 ? await versionQb.getMany() : [];

    return {
      items: items.map((row) => PageTemplateMapper.toDomain(row)),
      versions: new Map(
        versions.map((version) => [
          version.templateId,
          TemplateVersionMapper.toDomain(version),
        ]),
      ),
      hasNextPage,
    };
  }

  async findPublicById(
    id: string,
    context?: PersistenceContext,
  ): Promise<FindPublicPageTemplateByIdResult> {
    const repository = this.getRepo(context);

    const templateEntity = await repository
      .createQueryBuilder('template')
      .where('template.id = :id', { id })
      .andWhere('template.visibility = :publicVisibility', {
        publicVisibility: TemplateVisibility.PUBLIC,
      })
      .andWhere('template.status != :archivedStatus', {
        archivedStatus: TemplateStatus.ARCHIVED,
      })
      .andWhere(
        (subQb) => {
          const publishedListing = subQb
            .subQuery()
            .select('1')
            .from(TemplateListingOrmEntity, 'publishedListing')
            .where('publishedListing.templateId = template.id')
            .andWhere('publishedListing.status = :publishedListingStatus')
            .getQuery();
          return 'EXISTS ' + publishedListing;
        },
        { publishedListingStatus: TemplateListingStatus.PUBLISHED },
      )
      .getOne();

    if (!templateEntity) {
      return null;
    }

    const versionEntity = await repository.manager
      .getRepository(PageTemplateVersionOrmEntity)
      .createQueryBuilder('version')
      .innerJoin(
        TemplateListingOrmEntity,
        'activeListing',
        'activeListing.templateId = version.templateId',
      )
      .where('version.templateId = :templateId', {
        templateId: templateEntity.id,
      })
      .andWhere(
        '(activeListing.publishedVersionId IS NULL OR version.id = activeListing.publishedVersionId)',
      )
      .andWhere('version.status = :versionStatus', {
        versionStatus: TemplateVersionStatus.PUBLISHED,
      })
      .orderBy('version.versionNumber', 'DESC')
      .addOrderBy('version.id', 'DESC')
      .getOne();

    if (!versionEntity) {
      return null;
    }

    return {
      template: PageTemplateMapper.toDomain(templateEntity),
      version: TemplateVersionMapper.toDomain(versionEntity),
    };
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<PageTemplateOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(PageTemplateOrmEntity)
      : this.dataSource.getRepository(PageTemplateOrmEntity);
  }
}
