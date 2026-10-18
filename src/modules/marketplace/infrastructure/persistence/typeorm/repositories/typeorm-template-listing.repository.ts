import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import type {
  TemplateListingRepository,
  TemplateListingCategoryInfo,
} from '../../../../domain/repositories/template-listing.repository';
import { TemplateListingOrmEntity } from '../entities/template-listing.orm-entity';
import { TemplateListingCategoryOrmEntity } from '../entities/template-listing-category.orm-entity';
import { TemplateListingTagOrmEntity } from '../entities/template-listing-tag.orm-entity';
import { TemplateListingMapper } from '../mappers/template-listing.mapper';

@Injectable()
export class TypeOrmTemplateListingRepository implements TemplateListingRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findByTemplateIds(
    templateIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, TemplateListing>> {
    const ids = [...new Set(templateIds)];
    if (ids.length === 0) return new Map();
    const entities = await this.getRepo(context).find({
      where: { templateId: In(ids) },
    });
    return new Map(
      entities.map((entity) => [
        entity.templateId,
        TemplateListingMapper.toDomain(entity),
      ]),
    );
  }

  async findCategoriesByTemplateIds(
    templateIds: string[],
    options?: { activeOnly?: boolean },
    context?: PersistenceContext,
  ): Promise<Map<string, TemplateListingCategoryInfo[]>> {
    const ids = [...new Set(templateIds)];
    const result = new Map<string, TemplateListingCategoryInfo[]>(
      ids.map((id) => [id, []]),
    );
    if (ids.length === 0) return result;

    const qb = this.getRepo(context)
      .manager.getRepository(TemplateListingCategoryOrmEntity)
      .createQueryBuilder('association')
      .innerJoin('association.listing', 'listing')
      .innerJoin('association.category', 'category')
      .select('listing.templateId', 'templateId')
      .addSelect('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('category.slug', 'slug')
      .addSelect('category.isActive', 'isActive')
      .where('listing.templateId IN (:...templateIds)', { templateIds: ids })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .addOrderBy('category.id', 'ASC');
    if (options?.activeOnly)
      qb.andWhere('category.isActive = :isActive', { isActive: true });

    const rows = await qb.getRawMany<
      TemplateListingCategoryInfo & { templateId: string }
    >();
    const seen = new Map<string, Set<string>>();
    for (const row of rows) {
      const categories = result.get(row.templateId);
      if (!categories) continue;
      const categoryIds = seen.get(row.templateId) ?? new Set<string>();
      if (categoryIds.has(row.id)) continue;
      categoryIds.add(row.id);
      seen.set(row.templateId, categoryIds);
      categories.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        isActive: row.isActive,
      });
    }
    return result;
  }

  async create(
    listing: TemplateListing,
    context?: PersistenceContext,
  ): Promise<TemplateListing> {
    return this.save(listing, context);
  }

  async save(
    listing: TemplateListing,
    context?: PersistenceContext,
  ): Promise<TemplateListing> {
    const repository = this.getRepo(context);

    const saved = await repository.save(TemplateListingMapper.toOrm(listing));

    return TemplateListingMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateListing | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { id },
    });

    return entity ? TemplateListingMapper.toDomain(entity) : null;
  }

  async findByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateListing | null> {
    const repository = this.getRepo(context);

    const entity = await repository.findOne({
      where: { templateId },
    });

    return entity ? TemplateListingMapper.toDomain(entity) : null;
  }

  async replaceCategoryIds(
    listingId: string,
    categoryIds: string[],
    context: PersistenceContext,
  ): Promise<void> {
    if (!context) {
      throw new Error('replaceCategoryIds requires a transaction context');
    }

    const manager = this.getRepo(context).manager;
    const associations = manager.getRepository(
      TemplateListingCategoryOrmEntity,
    );

    // 1. Loại bỏ ID trùng
    const uniqueIds = [...new Set(categoryIds.map((id) => id.toLowerCase()))];

    // 2. Lấy Category hiện tại của Listing
    const current = await associations.find({ where: { listingId } });

    const currentIds = current.map((row) => row.categoryId);

    const currentSet = new Set(currentIds);
    const nextSet = new Set(uniqueIds);

    // 3. Xác định các Category cần thêm
    const toAdd = uniqueIds.filter((id) => !currentSet.has(id));

    // 4. Xác định các Category cần xóa
    const toRemove = currentIds.filter((id) => !nextSet.has(id));

    // 5. Xóa Category không còn được chọn
    if (toRemove.length > 0) {
      await associations.delete({ listingId, categoryId: In(toRemove) });
    }

    // 6. Thêm Category mới
    if (toAdd.length > 0) {
      await associations.insert(
        toAdd.map((categoryId) => ({ listingId, categoryId })),
      );
    }
  }

  async findTagsByTemplateIds(
    templateIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, string[]>> {
    const ids = [...new Set(templateIds)];
    const result = new Map<string, string[]>(ids.map((id) => [id, []]));
    if (ids.length === 0) return result;

    const rows = await this.getRepo(context)
      .manager.getRepository(TemplateListingTagOrmEntity)
      .createQueryBuilder('tag')
      .innerJoin('tag.listing', 'listing')
      .select('listing.templateId', 'templateId')
      .addSelect('tag.tag', 'tag')
      .where('listing.templateId IN (:...templateIds)', { templateIds: ids })
      .orderBy('tag.tag', 'ASC')
      .getRawMany<{ templateId: string; tag: string }>();

    for (const row of rows) result.get(row.templateId)?.push(row.tag);
    return result;
  }

  async replaceTags(
    listingId: string,
    tags: string[],
    context: PersistenceContext,
  ): Promise<void> {
    if (!context) {
      throw new Error('replaceTags requires a transaction context');
    }

    const repository = this.getRepo(context).manager.getRepository(
      TemplateListingTagOrmEntity,
    );
    await repository.delete({ listingId });
    if (tags.length > 0) {
      await repository.insert(tags.map((tag) => ({ listingId, tag })));
    }
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplateListingOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(TemplateListingOrmEntity)
      : this.dataSource.getRepository(TemplateListingOrmEntity);
  }
}
