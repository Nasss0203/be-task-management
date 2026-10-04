import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type {
  FindPageTemplatesFilters,
  FindPageTemplatesResult,
  PageTemplateRepository,
} from '../../../../domain/repositories/page-template.repository';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import { PageTemplateOrmEntity } from '../entities/page-template.orm-entity';
import { PageTemplateMapper } from '../mappers/page-template.mapper';

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
      qb.andWhere('template.status = :publishedStatus', {
        publishedStatus: TemplateStatus.PUBLISHED,
      });
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

    return {
      items: items.map((row) => PageTemplateMapper.toDomain(row)),
      hasNextPage,
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
