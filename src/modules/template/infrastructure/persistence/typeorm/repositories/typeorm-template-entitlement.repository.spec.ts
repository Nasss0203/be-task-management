import { DataSource } from 'typeorm';
import configuredDataSource from 'src/database/data-source';
import { TemplateEntitlementOrmEntity } from '../entities/template-entitlement.orm-entity';
import { TypeOrmTemplateEntitlementRepository } from './typeorm-template-entitlement.repository';

// Build actual PostgreSQL SQL with real entity metadata, without connecting to a DB.
class MetadataDataSource extends DataSource {
  async buildForTest() {
    await this.buildMetadatas();
  }
}

describe('TypeOrmTemplateEntitlementRepository claimed query', () => {
  let source: MetadataDataSource;
  let repository: TypeOrmTemplateEntitlementRepository;
  let query: jest.SpyInstance;
  const date = new Date('2026-10-11T00:00:00.000Z');
  const row = {
    entitlementId: 'entitlement-a',
    templateId: 'template-a',
    source: 'FREE_CLAIM',
    claimedAt: date,
    name: 'Planning',
    description: null,
    icon: null,
    coverUrl: null,
    visibility: 'PUBLIC',
    status: 'ARCHIVED',
    listingStatus: 'DRAFT',
    versionId: 'pinned-v1',
    versionTemplateId: 'template-a',
    versionNumber: 1,
    versionStatus: 'PUBLISHED',
    versionPublishedAt: date,
  };

  beforeAll(async () => {
    source = new MetadataDataSource({
      type: 'postgres',
      entities: configuredDataSource.options.entities,
    });
    await source.buildForTest();
    repository = new TypeOrmTemplateEntitlementRepository(source);
  });
  beforeEach(() => {
    const runner = source.createQueryRunner();
    query = jest.spyOn(runner, 'query').mockResolvedValue({ records: [] });
    jest.spyOn(source, 'createQueryRunner').mockReturnValue(runner);
  });
  afterEach(() => jest.restoreAllMocks());

  it('uses one user-scoped query, retains DRAFT/ARCHIVED, respects pin ownership/publication and redacts non-public metadata in SQL', async () => {
    query.mockResolvedValue({ records: [row] });
    const result = await repository.findClaimedByUser({
      userId: 'user-a',
      limit: 20,
    });
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, parameters] = query.mock.calls[0];
    expect(sql).toContain('"entitlement"."user_id" =');
    expect(parameters).toContain('user-a');
    expect(sql).toContain('COALESCE("listing"."published_version_id",');
    expect(sql).toContain('"version"."template_id" = "template"."id"');
    expect(sql).toContain('"version"."status" =');
    expect(sql).toContain(
      'ORDER BY "fallback"."version_number" DESC, "fallback_id" DESC LIMIT 1',
    );
    expect(sql).toContain('CASE WHEN "template"."visibility" =');
    expect(sql).toContain('ELSE NULL END');
    expect(sql).toContain(
      'ORDER BY "entitlement"."created_at" DESC, "entitlement"."id" DESC LIMIT 21',
    );
    const where = sql.split(' WHERE "entitlement"')[1];
    expect(where).not.toContain('"listing"."status"');
    expect(where).not.toContain('"template"."status"');
    expect(sql).not.toContain('source_page_id');
    expect(sql).not.toContain('snapshot_hash');
    expect(sql).not.toContain('page_template_blocks');
    expect(result.items[0]).toMatchObject({
      status: 'ARCHIVED',
      listingStatus: 'DRAFT',
      publishedVersion: { id: 'pinned-v1', versionNumber: 1 },
    });
  });

  it('applies cursor boundaries inside the user filter and removes the extra pagination row', async () => {
    query.mockResolvedValue({
      records: [row, { ...row, entitlementId: 'extra-row' }],
    });
    const result = await repository.findClaimedByUser({
      userId: 'user-b',
      limit: 1,
      cursor: { createdAt: date, id: 'last-entitlement' },
    });
    const [sql, parameters] = query.mock.calls[0];
    expect(sql).toContain('AND ("entitlement"."created_at" <');
    expect(sql).toContain('"entitlement"."id" <');
    expect(parameters).toEqual(
      expect.arrayContaining(['user-b', date, 'last-entitlement']),
    );
    expect(result.hasNextPage).toBe(true);
    expect(result.items).toHaveLength(1);
  });

  it('returns an empty terminal page', async () => {
    await expect(
      repository.findClaimedByUser({ userId: 'user-a', limit: 20 }),
    ).resolves.toEqual({ items: [], hasNextPage: false });
  });

  it.each([
    {
      versionId: null,
      versionTemplateId: null,
      versionNumber: null,
      versionStatus: null,
    },
    { versionTemplateId: 'other-template' },
    { versionStatus: 'DRAFT' },
  ])(
    'never emits a missing, foreign, or draft version (%s)',
    async (version) => {
      query.mockResolvedValue({ records: [{ ...row, ...version }] });
      const result = await repository.findClaimedByUser({
        userId: 'user-a',
        limit: 20,
      });
      expect(result.items[0].publishedVersion).toBeNull();
    },
  );

  it('reuses the existing uniqueness constraints', () => {
    const metadata = source.getMetadata(TemplateEntitlementOrmEntity);
    expect(
      metadata.uniques.some(
        (unique) =>
          unique.name === 'UQ_template_entitlements_template_user' &&
          unique.columns.map((column) => column.propertyName).join(',') ===
            'templateId,userId',
      ),
    ).toBe(true);
  });
});
