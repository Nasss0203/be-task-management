import {
  DataSource,
  EntitySchema,
  getMetadataArgsStorage,
  SelectQueryBuilder,
} from 'typeorm';
import type { EntitySchemaColumnOptions } from 'typeorm';
import { TypeOrmPageTemplateRepository } from './typeorm-page-template.repository';
import { PageTemplateOrmEntity } from '../entities/page-template.orm-entity';
import { PageTemplateVersionOrmEntity } from '../entities/page-template-version.orm-entity';
import { TemplateListingOrmEntity } from '../../../../../marketplace/infrastructure/persistence/typeorm/entities/template-listing.orm-entity';
import { TemplateListingCategoryOrmEntity } from '../../../../../marketplace/infrastructure/persistence/typeorm/entities/template-listing-category.orm-entity';
import { TemplateCategoryOrmEntity } from '../../../../../marketplace/infrastructure/persistence/typeorm/entities/template-category.orm-entity';
import { TemplateListingTagOrmEntity } from '../../../../../marketplace/infrastructure/persistence/typeorm/entities/template-listing-tag.orm-entity';
import { TemplateListScope } from '../../../../presentation/http/requests/list-page-templates.request';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateMapper } from '../mappers/page-template.mapper';
import { TemplateVersionMapper } from '../mappers/template-version.mapper';

// Build TypeORM metadata and SQL only; never initialize a connection or execute SQL.
class MetadataOnlyDataSource extends DataSource {
  async prepare() {
    await this.buildMetadatas();
  }
}

describe('Public category filtering SQL and pagination', () => {
  let source: MetadataOnlyDataSource;
  let repository: TypeOrmPageTemplateRepository;
  let captured: {
    sql: string;
    parameters: Record<string, unknown>;
    alias: string;
  }[];
  let templateRows: PageTemplateOrmEntity[];
  let versionRows: PageTemplateVersionOrmEntity[];
  beforeAll(async () => {
    const storage = getMetadataArgsStorage();
    const entities = [
      PageTemplateOrmEntity,
      PageTemplateVersionOrmEntity,
      TemplateListingOrmEntity,
      TemplateListingCategoryOrmEntity,
      TemplateCategoryOrmEntity,
      TemplateListingTagOrmEntity,
    ].map((target) => {
      const columns: Record<string, EntitySchemaColumnOptions> = {};
      for (const column of storage.columns.filter(
        (column) => column.target === target,
      ))
        columns[column.propertyName] = {
          ...column.options,
        } as EntitySchemaColumnOptions;
      return new EntitySchema({
        name: target.name,
        target,
        tableName: storage.tables.find((table) => table.target === target)!
          .name,
        columns,
        relations:
          target === TemplateListingCategoryOrmEntity
            ? {
                listing: {
                  type: 'many-to-one',
                  target: TemplateListingOrmEntity.name,
                  joinColumn: { name: 'listing_id' },
                },
                category: {
                  type: 'many-to-one',
                  target: TemplateCategoryOrmEntity.name,
                  joinColumn: { name: 'category_id' },
                },
              }
            : undefined,
      });
    });
    source = new MetadataOnlyDataSource({ type: 'postgres', entities });
    await source.prepare();
    repository = new TypeOrmPageTemplateRepository(source);
  });
  beforeEach(() => {
    captured = [];
    templateRows = [];
    versionRows = [];
    jest
      .spyOn(SelectQueryBuilder.prototype, 'getMany')
      .mockImplementation(async function (this: SelectQueryBuilder<any>) {
        captured.push({
          sql: this.getSql(),
          parameters: this.getParameters(),
          alias: this.alias,
        });
        return this.alias === 'template' ? templateRows : versionRows;
      });
  });
  afterEach(() => jest.restoreAllMocks());
  it.each(['esports', 'gaming', 'education'])(
    'binds %s in a correlated EXISTS with active category and published listing',
    async (categorySlug) => {
      await repository.findMany({
        scope: TemplateListScope.PUBLIC,
        requirePublishedVersion: true,
        categorySlug,
        limit: 20,
      });
      const { sql, parameters } = captured[0];
      expect(sql).toContain(
        'EXISTS (SELECT 1 FROM "template_listing_categories" "categoryAssociation"',
      );
      expect(sql).toContain(
        '"categoryListing"."template_id" = "template"."id"',
      );
      expect(sql).toContain('"filterCategory"."slug" =');
      expect(sql).toContain('"filterCategory"."is_active" =');
      expect(sql).toContain('"categoryListing"."status" =');
      expect(parameters).toMatchObject({
        categorySlug,
        categoryActive: true,
        categoryListingStatus: 'PUBLISHED',
        publicVisibility: 'PUBLIC',
        archivedStatus: 'ARCHIVED',
        publishedVersionStatus: 'PUBLISHED',
        publishedListingStatus: 'PUBLISHED',
      });
      expect(sql).not.toContain(categorySlug);
      expect(sql).toContain('LIMIT 21');
      expect(sql.indexOf('"filterCategory"."slug"')).toBeLessThan(
        sql.indexOf('LIMIT 21'),
      );
    },
  );
  it.each([TemplateListScope.MINE, TemplateListScope.WORKSPACE])(
    'does not apply category filtering to %s scope',
    async (scope) => {
      await repository.findMany({
        scope,
        categorySlug: 'esports',
        userId: 'u1',
        workspaceId: 'w1',
        canManageWorkspace: true,
        limit: 20,
      });
      expect(captured[0].sql).not.toContain('template_listing_categories');
      expect(captured[0].parameters).not.toHaveProperty('categorySlug');
    },
  );
  it('keeps the unfiltered public query unchanged', async () => {
    await repository.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      limit: 20,
    });
    expect(captured[0].sql).not.toContain('template_listing_categories');
  });
  it('combines category, search and cursor before limit and preserves pinned-version selection', async () => {
    const template = PageTemplate.create({
      id: '550e8400-e29b-41d4-a716-446655440001',
      workspaceId: 'w1',
      sourcePageId: null,
      name: 'Manager',
      createdBy: 'u1',
    });
    const second = PageTemplate.create({
      id: '550e8400-e29b-41d4-a716-446655440002',
      workspaceId: 'w1',
      sourcePageId: null,
      name: 'Other',
      createdBy: 'u1',
    });
    templateRows = [
      PageTemplateMapper.toOrm(template),
      PageTemplateMapper.toOrm(second),
    ];
    const version = TemplateVersion.create({
      id: 'pinned',
      templateId: template.getId(),
      versionNumber: 1,
      createdBy: 'u1',
    });
    version.publish();
    versionRows = [TemplateVersionMapper.toOrm(version)];
    const date = new Date('2026-10-12T00:00:00Z');
    const result = await repository.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      categorySlug: 'esports',
      search: 'manager',
      cursor: { createdAt: date, id: template.getId() },
      limit: 1,
    });
    expect(captured[0].parameters).toMatchObject({
      categorySlug: 'esports',
      search: '%manager%',
      cursorCreatedAt: date,
      cursorId: template.getId(),
    });
    expect(captured[0].sql).toContain('ILIKE');
    expect(captured[0].sql).toContain(
      'ORDER BY "template"."created_at" DESC, "template"."id" DESC LIMIT 2',
    );
    expect(result.hasNextPage).toBe(true);
    expect(result.items.map((item) => item.getId())).toEqual([
      template.getId(),
    ]);
    expect(result.versions.get(template.getId())?.getId()).toBe('pinned');
    expect(captured[1].sql).toContain(
      '"activeListing"."published_version_id" IS NULL OR "version"."id" = "activeListing"."published_version_id"',
    );
    expect(captured[1].parameters.templateIds).toEqual([template.getId()]);
  });
  it('filters the public catalog by tag and offer, and search also matches tags', async () => {
    await repository.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      tag: 'crm',
      offerType: 'PAID',
      search: 'sales',
      limit: 20,
    });
    expect(captured[0].parameters).toMatchObject({
      filterTag: 'crm',
      filterOfferType: 'PAID',
      search: '%sales%',
    });
    expect(captured[0].sql).toContain('"filterTag"."tag" = $');
    expect(captured[0].sql).toContain('"offerListing"."offer_type" = $');
    expect(captured[0].sql).toContain('"searchTag"."tag" ILIKE $');
  });
  it('returns no next page and skips version execution when the SQL result is empty', async () => {
    const result = await repository.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      categorySlug: 'missing',
      limit: 20,
    });
    expect(result).toEqual({
      items: [],
      versions: new Map(),
      hasNextPage: false,
    });
    expect(captured).toHaveLength(1);
  });
});
