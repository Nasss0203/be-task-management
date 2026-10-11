import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { CreateTemplateListingHandler } from '../template-listing/create-template-listing/create-template-listing.handler';
import { CreateTemplateListingCommand } from '../template-listing/create-template-listing/create-template-listing.command';
/* PostgreSQL-only: MARKETPLACE_TEST_DATABASE_URL must point to a dedicated test database.
 * Each run creates and removes one random schema. No application .env is loaded.
 * Uses production repositories, UnitOfWork, handler and migration with relation-free fixture metadata.
 */
import { randomUUID } from 'crypto';
import { DataSource, EntitySchema, getMetadataArgsStorage } from 'typeorm';
import type { EntitySchemaColumnOptions } from 'typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { PinMarketplaceVersion1791676800000 } from 'src/database/migrations/1791676800000-pin-marketplace-version';
import { PageTemplateOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageTemplateVersionOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';
import { TemplateListingOrmEntity } from '../../../infrastructure/persistence/typeorm/entities/template-listing.orm-entity';
import { TypeOrmPageTemplateRepository } from '../../../infrastructure/persistence/typeorm/repositories/typeorm-page-template.repository';
import { TypeOrmTemplateVersionRepository } from '../../../infrastructure/persistence/typeorm/repositories/typeorm-template-version.repository';
import { TypeOrmTemplateListingRepository } from '../../../infrastructure/persistence/typeorm/repositories/typeorm-template-listing.repository';
import { PageTemplate } from '../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../domain/aggregates/template-version/template-version.aggregate';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplateListScope } from '../../../presentation/http/requests/list-page-templates.request';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PublishTemplateToMarketplaceCommand } from './publish-template-to-marketplace.command';
import { PublishTemplateToMarketplaceHandler } from './publish-template-to-marketplace.handler';

const url = process.env.MARKETPLACE_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
suite('Marketplace PostgreSQL atomicity and selection', () => {
  const schema = 'marketplace_test_' + randomUUID().replace(/-/g, '');
  let admin: DataSource;
  let db: DataSource;
  let templates: TypeOrmPageTemplateRepository;
  let versions: TypeOrmTemplateVersionRepository;
  let listings: TypeOrmTemplateListingRepository;
  let handler: PublishTemplateToMarketplaceHandler;
  let legacyPin: string | null;
  let expectedLegacyPin: string;
  let template: PageTemplate;
  let v1: TemplateVersion;
  let v2: TemplateVersion;
  const userId = randomUUID();
  const auth = {
    authorize: jest.fn().mockResolvedValue(false),
  } as unknown as AuthorizationService;

  function metadata(includePin: boolean) {
    return [
      PageTemplateOrmEntity,
      PageTemplateVersionOrmEntity,
      TemplateListingOrmEntity,
    ].map((target) => {
      const storage = getMetadataArgsStorage();
      const columns: Record<string, EntitySchemaColumnOptions> = {};
      for (const c of storage.columns.filter((c) => c.target === target)) {
        if (!includePin && c.propertyName === 'publishedVersionId') continue;
        columns[c.propertyName] = { ...c.options } as EntitySchemaColumnOptions;
      }
      return new EntitySchema({
        name: target.name,
        target,
        schema,
        tableName: storage.tables.find((t) => t.target === target)!.name,
        columns,
        uniques:
          target === TemplateListingOrmEntity
            ? [
                {
                  name: 'UQ_template_listings_template_id',
                  columns: ['templateId'],
                },
              ]
            : [],
      });
    });
  }

  beforeAll(async () => {
    admin = await new DataSource({ type: 'postgres', url }).initialize();
    await admin.query('CREATE SCHEMA "' + schema + '"');
    const fixture = await new DataSource({
      type: 'postgres',
      url,
      schema,
      entities: metadata(false),
      synchronize: true,
      extra: { options: '-c search_path=' + schema },
    }).initialize();
    const legacyTemplate = PageTemplate.create({
      workspaceId: randomUUID(),
      sourcePageId: null,
      name: 'Legacy',
      createdBy: userId,
    });
    await new TypeOrmPageTemplateRepository(fixture).save(legacyTemplate);
    const legacyVersion = TemplateVersion.create({
      templateId: legacyTemplate.getId(),
      versionNumber: 2,
      createdBy: userId,
    });
    legacyVersion.publish();
    await new TypeOrmTemplateVersionRepository(fixture).save(legacyVersion);
    const legacyListing = TemplateListing.create({
      templateId: legacyTemplate.getId(),
      createdBy: userId,
    });
    legacyListing.publish();
    await new TypeOrmTemplateListingRepository(fixture).save(legacyListing);
    expectedLegacyPin = legacyVersion.getId();
    const runner = fixture.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      await new PinMarketplaceVersion1791676800000().up(runner);
      const migrated = (await runner.query(
        'SELECT published_version_id FROM template_listings WHERE template_id = $1',
        [legacyTemplate.getId()],
      )) as { published_version_id: string | null }[];
      legacyPin = migrated[0].published_version_id;
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
      await fixture.destroy();
    }
    db = await new DataSource({
      type: 'postgres',
      url,
      schema,
      entities: metadata(true),
      extra: { options: '-c search_path=' + schema },
    }).initialize();
  }, 30000);

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
    if (admin?.isInitialized) {
      await admin.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
      await admin.destroy();
    }
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await db.query(
      'TRUNCATE template_listings, page_template_versions, page_templates',
    );
    templates = new TypeOrmPageTemplateRepository(db);
    versions = new TypeOrmTemplateVersionRepository(db);
    listings = new TypeOrmTemplateListingRepository(db);
    handler = new PublishTemplateToMarketplaceHandler(
      templates,
      versions,
      listings,
      new TypeOrmUnitOfWork(db),
      auth,
    );
    template = PageTemplate.create({
      workspaceId: randomUUID(),
      sourcePageId: null,
      name: 'Integration',
      createdBy: userId,
    });
    await templates.save(template);
    v1 = TemplateVersion.create({
      templateId: template.getId(),
      versionNumber: 1,
      createdBy: userId,
    });
    v2 = TemplateVersion.create({
      templateId: template.getId(),
      versionNumber: 2,
      createdBy: userId,
    });
    v2.publish();
    await versions.save(v1);
    await versions.save(v2);
  });
  const command = (versionId?: string) =>
    new PublishTemplateToMarketplaceCommand(
      template.getId(),
      versionId ?? v1.getId(),
      userId,
      TemplateOfferType.FREE,
    );

  it('pins v1 in both public list and detail despite published v2', async () => {
    await handler.execute(command());
    const detail = await templates.findPublicById(template.getId());
    expect(detail?.version.getId()).toBe(v1.getId());
    const list = await templates.findMany({
      scope: TemplateListScope.PUBLIC,
      requirePublishedVersion: true,
      limit: 10,
    });
    expect(list.versions.get(template.getId())?.getId()).toBe(v1.getId());
    expect((await templates.findById(template.getId()))?.getStatus()).toBe(
      'DRAFT',
    );
  });
  it.each(['version', 'visibility', 'listing'])(
    'rolls back all writes when %s save throws after persistence',
    async (step) => {
      if (step === 'version') {
        const original = versions.save.bind(versions) as typeof versions.save;
        jest.spyOn(versions, 'save').mockImplementation(async (...args) => {
          await original(...args);
          throw new Error('Injected persistence failure');
        });
      } else if (step === 'visibility') {
        const original = templates.save.bind(
          templates,
        ) as typeof templates.save;
        jest.spyOn(templates, 'save').mockImplementation(async (...args) => {
          await original(...args);
          throw new Error('Injected persistence failure');
        });
      } else {
        const original = listings.save.bind(listings) as typeof listings.save;
        jest.spyOn(listings, 'save').mockImplementation(async (...args) => {
          await original(...args);
          throw new Error('Injected persistence failure');
        });
      }
      await expect(handler.execute(command())).rejects.toThrow('Injected');
      expect((await versions.findById(v1.getId()))?.isDraft()).toBe(true);
      expect(
        (await templates.findById(template.getId()))?.getVisibility(),
      ).toBe('PRIVATE');
      expect(await listings.findByTemplateId(template.getId())).toBeNull();
    },
  );
  it('serializes concurrent requests and repeated calls without duplicate listings', async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () => handler.execute(command())),
    );
    expect(new Set(results.map((r) => r.listing.id)).size).toBe(1);
    const repeat = await handler.execute(command());
    expect(repeat.listing.published_at).toEqual(
      results[0].listing.published_at,
    );
    const rows = await db.query<{ id: string }[]>(
      'SELECT id FROM template_listings',
    );
    expect(rows).toHaveLength(1);
  });
  it('database constraint rejects a version from another template', async () => {
    await handler.execute(command());
    const other = PageTemplate.create({
      sourcePageId: null,
      workspaceId: randomUUID(),
      name: 'Other',
      createdBy: userId,
    });
    await templates.save(other);
    const foreign = TemplateVersion.create({
      templateId: other.getId(),
      versionNumber: 1,
      createdBy: userId,
    });
    foreign.publish();
    await versions.save(foreign);
    await expect(
      db.query(
        'UPDATE template_listings SET published_version_id = $1 WHERE template_id = $2',
        [foreign.getId(), template.getId()],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23503' } });
  });
  it('backfills a legacy published listing without changing its identity', () => {
    expect(legacyPin).toBe(expectedLegacyPin);
  });
  it('coordinates concurrent legacy create-listing and one-click requests', async () => {
    const legacy = new CreateTemplateListingHandler(
      templates,
      listings,
      new TypeOrmUnitOfWork(db),
      auth,
    );
    const outcomes = await Promise.allSettled([
      legacy.execute(
        new CreateTemplateListingCommand(template.getId(), userId),
      ),
      handler.execute(command()),
      handler.execute(command()),
    ]);
    expect(outcomes[1].status).toBe('fulfilled');
    expect(outcomes[2].status).toBe('fulfilled');
    expect(
      await db.query<{ id: string }[]>('SELECT id FROM template_listings'),
    ).toHaveLength(1);
  });
});
