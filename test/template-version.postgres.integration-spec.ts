import { ConflictException, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Server } from 'http';
import request from 'supertest';
import { DataSource, type QueryRunner } from 'typeorm';
import configuredDataSource from 'src/database/data-source';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { ContentPageProvisioningService } from 'src/modules/content/application/services/content-page-provisioning.service';
import { ContentPageSnapshotReaderService } from 'src/modules/content/application/services/content-page-snapshot-reader.service';
import { PublicSubdomainAllocatorService } from 'src/modules/content/application/services/public-subdomain-allocator.service';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { PageBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageShareLinkOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-share-link.orm-entity';
import { PublishedSiteOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/published-site.orm-entity';
import { TypeOrmPageRepository } from 'src/modules/content/infrastructure/persistence/typeorm/repositories/typeorm-page.repository';
import { TypeOrmPageBlockRepository } from 'src/modules/content/infrastructure/persistence/typeorm/repositories/typeorm-page-block.repository';
import { TypeOrmPublishedSiteRepository } from 'src/modules/content/infrastructure/persistence/typeorm/repositories/typeorm-published-site.repository';
import type { ProvisionDatabaseSnapshot } from 'src/modules/database/application/ports/database-provisioning.port';
import { DatabaseProvisioningService } from 'src/modules/database/application/services/database-provisioning.service';
import { DatabaseSnapshotReaderService } from 'src/modules/database/application/services/database-snapshot-reader.service';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { DatabaseOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database.orm-entity';
import { DatabasePropertyOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-property.orm-entity';
import { PropertyOptionOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/property-option.orm-entity';
import { DatabaseRowOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { RowValueOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/row-value.orm-entity';
import { DatabaseViewOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-view.orm-entity';
import { TypeOrmDatabaseRepository } from 'src/modules/database/infrastructure/persistence/typeorm/repositories/typeorm-database.repository';
import { TypeOrmDatabaseRowRepository } from 'src/modules/database/infrastructure/persistence/typeorm/repositories/typeorm-database-row.repository';
import { TypeOrmDatabaseViewRepository } from 'src/modules/database/infrastructure/persistence/typeorm/repositories/typeorm-database-view.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { TypeOrmWorkspacePermissionReader } from 'src/modules/permission/infrastructure/persistence/typeorm/adapters/workspace-permission-reader.adapter';
import { TypeOrmTeamspacePermissionReader } from 'src/modules/permission/infrastructure/persistence/typeorm/adapters/teamspace-permission-reader.adapter';
import { TypeOrmResourceAuthorizationReader } from 'src/modules/permission/infrastructure/persistence/typeorm/adapters/resource-authorization-reader.adapter';
import { TypeOrmPageSharePermissionReader } from 'src/modules/permission/infrastructure/persistence/typeorm/readers/typeorm-page-share-permission.reader';
import { TypeOrmPageGeneralAccessReader } from 'src/modules/permission/infrastructure/persistence/typeorm/readers/typeorm-page-general-access.reader';
import { TypeOrmPageShareLinkAuthorizationReader } from 'src/modules/permission/infrastructure/persistence/typeorm/readers/typeorm-page-share-link-authorization.reader';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { TeamspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { TeamspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { PageShareLinkTokenService } from 'src/shared/security/page-share-link-token.service';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  CreatePageTemplateHandler,
  type CreatePageTemplateResult,
} from 'src/modules/template/application/commands/page-template/create-page-template/create-page-template.handler';
import { CreateTemplateVersionHandler } from 'src/modules/template/application/commands/template-version/create-template-version/create-template-version.handler';
import { CreateTemplateVersionCommand } from 'src/modules/template/application/commands/template-version/create-template-version/create-template-version.command';
import { PublishTemplateVersionHandler } from 'src/modules/template/application/commands/template-version/publish-template-version/publish-template-version.handler';
import {
  UseTemplateHandler,
  type UseTemplateResult,
} from 'src/modules/template/application/commands/page-template/use-template/use-template.handler';
import { GetPageTemplateHandler } from 'src/modules/template/application/queries/page-template/get-page-template/get-page-template.handler';
import { ListTemplateVersionsHandler } from 'src/modules/template/application/queries/template-version/list-template-versions/list-template-versions.handler';
import { GetTemplatePreviewHandler } from 'src/modules/template/application/queries/template-preview/get-template-preview/get-template-preview.handler';
import { TemplateVersionContentSnapshotService } from 'src/modules/template/application/services/template-version-content-snapshot.service';
import { TemplateSnapshotFingerprintService } from 'src/modules/template/application/services/template-snapshot-fingerprint.service';
import type { TemplatePreviewResponseDto } from 'src/modules/template/application/dto/template-preview/template-preview.response.dto';
import type { TemplateVersionResponseDto } from 'src/modules/template/application/dto/template-version/template-version.response.dto';
import type { ListTemplateVersionsResponseDto } from 'src/modules/template/application/dto/template-version/list-template-versions.response.dto';
import { TypeOrmPageTemplateRepository } from 'src/modules/template/infrastructure/persistence/typeorm/repositories/typeorm-page-template.repository';
import { TypeOrmTemplateVersionRepository } from 'src/modules/template/infrastructure/persistence/typeorm/repositories/typeorm-template-version.repository';
import { TypeOrmPageTemplateBlockRepository } from 'src/modules/template/infrastructure/persistence/typeorm/repositories/typeorm-page-template-block.repository';
import { TypeOrmPageTemplateDatabaseSnapshotRepository } from 'src/modules/template/infrastructure/persistence/typeorm/repositories/typeorm-page-template-database-snapshot.repository';
import { TemplateController } from 'src/modules/template/presentation/http/controllers/template.controller';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { PageTemplate } from 'src/modules/template/domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from 'src/modules/template/domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateOrmEntity } from 'src/modules/template/infrastructure/persistence/typeorm/entities/page-template.orm-entity';

// Opt in against a migrated local database. All test writes stay in one outer
// transaction and are rolled back, except the concurrency test's dedicated
// template, deleted in finally so two real connections can see it.
// HTTP authentication supplies a fixture user;
// application authorization, readers, repositories, and provisioning are real.
const describePostgres =
  process.env.TEMPLATE_POSTGRES_INTEGRATION === '1' ? describe : describe.skip;

const dataSource = new DataSource({
  ...configuredDataSource.options,
  logging: false,
});

describePostgres('Template version PostgreSQL and HTTP integration', () => {
  let runner: QueryRunner;
  let app: INestApplication;
  let userId: string;
  let sourcePageId: string;
  let templateId: string;
  let createVersion: CreateTemplateVersionHandler;
  let versionRepo: TypeOrmTemplateVersionRepository;
  let blockRepo: TypeOrmPageTemplateBlockRepository;
  let databaseRepo: TypeOrmPageTemplateDatabaseSnapshotRepository;
  let pageReader: ContentPageSnapshotReaderService;
  let databaseReader: DatabaseSnapshotReaderService;
  let sourceBlockId: string;

  beforeAll(async () => {
    if (
      !['localhost', '127.0.0.1', '::1'].includes(
        String(
          dataSource.options.type === 'postgres' ? dataSource.options.host : '',
        ),
      )
    ) {
      throw new Error(
        'This integration test requires a local PostgreSQL database',
      );
    }
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    const manager = runner.manager;
    const owner = await manager
      .getRepository(WorkspaceMemberOrmEntity)
      .findOneBy({
        roleName: WorkspaceRole.OWNER,
        membershipType: WorkspaceMembershipType.MEMBER,
      });
    if (!owner) throw new Error('A local workspace owner fixture is required');
    userId = owner.userId;

    // Route default repository reads through the same uncommitted fixture
    // connection. UnitOfWork still uses real TypeORM savepoint transactions.
    const scopedSource = new Proxy(dataSource, {
      get(target, key): unknown {
        if (key === 'manager') return manager;
        if (key === 'getRepository') return manager.getRepository.bind(manager);
        if (key === 'query') return manager.query.bind(manager);
        if (key === 'transaction') return manager.transaction.bind(manager);
        return Reflect.get(target, key) as unknown;
      },
    });
    const uow = new TypeOrmUnitOfWork(scopedSource);
    const pages = new TypeOrmPageRepository(
      manager.getRepository(PageOrmEntity),
    );
    const pageBlocks = new TypeOrmPageBlockRepository(
      manager.getRepository(PageBlockOrmEntity),
    );
    const liveDatabases = new TypeOrmDatabaseRepository(
      manager.getRepository(DatabaseOrmEntity),
      manager.getRepository(DatabasePropertyOrmEntity),
      manager.getRepository(PropertyOptionOrmEntity),
    );
    const liveRows = new TypeOrmDatabaseRowRepository(
      manager.getRepository(DatabaseRowOrmEntity),
      manager.getRepository(RowValueOrmEntity),
    );
    const liveViews = new TypeOrmDatabaseViewRepository(
      manager.getRepository(DatabaseViewOrmEntity),
    );
    const subdomains = new PublicSubdomainAllocatorService(
      pages,
      new TypeOrmPublishedSiteRepository(
        manager.getRepository(PublishedSiteOrmEntity),
      ),
    );
    const pageProvisioning = new ContentPageProvisioningService(
      pages,
      pageBlocks,
      uow,
      subdomains,
    );
    const databaseProvisioning = new DatabaseProvisioningService(
      liveDatabases,
      liveRows,
      liveViews,
      uow,
    );
    pageReader = new ContentPageSnapshotReaderService(pages, pageBlocks);
    databaseReader = new DatabaseSnapshotReaderService(
      liveDatabases,
      liveRows,
      liveViews,
    );
    const generalAccess = new TypeOrmPageGeneralAccessReader(scopedSource);
    const authorization = new AuthorizationService(
      new TypeOrmWorkspacePermissionReader(
        manager.getRepository(WorkspaceMemberOrmEntity),
      ),
      new TypeOrmTeamspacePermissionReader(
        manager.getRepository(TeamspaceOrmEntity),
        manager.getRepository(TeamspaceMemberOrmEntity),
      ),
      new TypeOrmResourceAuthorizationReader(
        manager.getRepository(PageOrmEntity),
        manager.getRepository(PageBlockOrmEntity),
      ),
      new TypeOrmPageSharePermissionReader(scopedSource),
      generalAccess,
      new TypeOrmPageShareLinkAuthorizationReader(
        manager.getRepository(PageShareLinkOrmEntity),
        generalAccess,
        new PageShareLinkTokenService(),
      ),
    );
    const templates = new TypeOrmPageTemplateRepository(scopedSource);
    versionRepo = new TypeOrmTemplateVersionRepository(scopedSource);
    blockRepo = new TypeOrmPageTemplateBlockRepository(scopedSource);
    databaseRepo = new TypeOrmPageTemplateDatabaseSnapshotRepository(
      scopedSource,
    );
    const snapshotService = new TemplateVersionContentSnapshotService(
      databaseReader,
      blockRepo,
      databaseRepo,
    );
    const createTemplate = new CreatePageTemplateHandler(
      pageReader,
      templates,
      versionRepo,
      uow,
      authorization,
      snapshotService,
      new TemplateSnapshotFingerprintService(),
    );
    createVersion = new CreateTemplateVersionHandler(
      templates,
      versionRepo,
      uow,
      authorization,
      pageReader,
      snapshotService,
      new TemplateSnapshotFingerprintService(),
    );
    const publish = new PublishTemplateVersionHandler(
      templates,
      versionRepo,
      uow,
      authorization,
    );
    const use = new UseTemplateHandler(
      templates,
      versionRepo,
      blockRepo,
      databaseRepo,
      pageProvisioning,
      databaseProvisioning,
      uow,
      authorization,
    );
    const preview = new GetTemplatePreviewHandler(
      templates,
      versionRepo,
      blockRepo,
      authorization,
      databaseRepo,
    );
    const detail = new GetPageTemplateHandler(templates, authorization);
    const listVersions = new ListTemplateVersionsHandler(
      detail,
      versionRepo,
      authorization,
    );
    const implementations: Record<string, unknown> = {
      CreatePageTemplateHandler: createTemplate,
      CreateTemplateVersionHandler: createVersion,
      PublishTemplateVersionHandler: publish,
      UseTemplateHandler: use,
      GetTemplatePreviewHandler: preview,
      GetPageTemplateHandler: detail,
      ListTemplateVersionsHandler: listVersions,
    };
    const module = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: Object.entries(TEMPLATE_TYPES.applications).map(
        ([name, provide]) => ({
          provide,
          useValue: implementations[name] ?? {
            execute: () => {
              throw new Error('Unused route');
            },
          },
        }),
      ),
    }).compile();
    app = module.createNestApplication();
    app.use(
      (
        req: Request & { user?: { id: string } },
        _res: Response,
        next: NextFunction,
      ) => {
        req.user = { id: userId };
        next();
      },
    );
    await app.init();

    const shell = await pageProvisioning.createPageShell(
      {
        workspaceId: owner.workspaceId,
        title: `Version integration ${randomUUID()}`,
        createdBy: userId,
      },
      manager,
    );
    sourcePageId = shell.pageId;
    const fixture: ProvisionDatabaseSnapshot = {
      sourceId: 'db',
      name: 'Tasks',
      properties: [
        PropertyType.SELECT,
        PropertyType.MULTI_SELECT,
        PropertyType.STATUS,
        PropertyType.PERSON,
        PropertyType.FILE,
      ].map((type, index) => ({
        sourceId: `property-${index}`,
        name: type,
        type,
        isDefault: false,
        isHideable: true,
        position: `a${index}`,
        options:
          index < 3
            ? [0, 1].map((n) => ({
                sourceId: `option-${index}-${n}`,
                name: `Option ${n}`,
                color: 'blue',
                position: `a${n}`,
              }))
            : [],
      })),
      rows: [
        {
          sourceId: 'row',
          values: [
            {
              sourceId: 'value-0',
              propertySourceId: 'property-0',
              value: 'option-0-0',
            },
            {
              sourceId: 'value-1',
              propertySourceId: 'property-1',
              value: ['option-1-0', 'option-1-1'],
            },
            {
              sourceId: 'value-2',
              propertySourceId: 'property-2',
              value: 'option-2-1',
            },
            {
              sourceId: 'value-3',
              propertySourceId: 'property-3',
              value: [userId],
            },
            {
              sourceId: 'value-4',
              propertySourceId: 'property-4',
              value: ['raw-file-reference'],
            },
          ],
        },
      ],
      views: [0, 1].map((index) => ({
        sourceId: `view-${index}`,
        name: `View ${index}`,
        type: DatabaseViewType.TABLE,
        position: `a${index}`,
        properties: [0, 1, 2, 3, 4].map((n) => ({
          sourceId: `view-${index}-property-${n}`,
          propertySourceId: `property-${n}`,
          position: `a${n}`,
          visible: true,
          width: 150,
        })),
      })),
    };
    const live = await databaseProvisioning.provisionDatabases(
      { pageId: sourcePageId, databases: [fixture] },
      manager,
    );
    const parent = await pageBlocks.save(
      PageBlock.create({
        pageId: sourcePageId,
        type: PageBlockType.TOGGLE,
        createdBy: userId,
        content: { text: 'v1' },
      }),
      manager,
    );
    sourceBlockId = parent.getId();
    for (const index of [0, 1]) {
      await pageBlocks.save(
        PageBlock.create({
          pageId: sourcePageId,
          parentBlockId: parent.getId(),
          type: PageBlockType.DATABASE_VIEW,
          createdBy: userId,
          orderIndex: index + 1,
          dataConfig: {
            database_id: live.databaseIdMap.get('db'),
            view_id: live.viewIdMap.get(`view-${index}`),
          },
        }),
        manager,
      );
    }
  }, 30000);

  afterAll(async () => {
    await app?.close();
    if (runner) {
      if (runner.isTransactionActive) await runner.rollbackTransaction();
      await runner.release();
    }
    if (sourcePageId)
      expect(
        await dataSource
          .getRepository(PageOrmEntity)
          .existsBy({ id: sourcePageId }),
      ).toBe(false);
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it('creates v1, changes source, creates/lists/previews/publishes/uses isolated v2 over HTTP with the complete PostgreSQL graph', async () => {
    const server = app.getHttpServer() as Server;
    const initialResponse = await request(server)
      .post(`/templates/from-page/${sourcePageId}`)
      .send({})
      .expect(201);
    const initial = initialResponse.body as CreatePageTemplateResult;
    templateId = initial.template.id;
    const initialHash = (await versionRepo.findById(
      initial.version.id,
      runner.manager,
    ))!.getSnapshotHash();
    expect(initialHash).toMatch(/^[a-f0-9]{64}$/);
    const duplicate = await request(server)
      .post(`/templates/${templateId}/versions`)
      .expect(409);
    expect(duplicate.body).toMatchObject({
      message: 'No changes detected since the latest template version',
    });
    expect(
      await versionRepo.findByTemplateId(templateId, runner.manager),
    ).toHaveLength(1);
    await request(server)
      .post(`/templates/${templateId}/versions/${initial.version.id}/publish`)
      .expect(201);
    const beforeResponse = await request(server)
      .get(`/templates/${templateId}/versions/${initial.version.id}/preview`)
      .expect(200);
    const before = beforeResponse.body as TemplatePreviewResponseDto;
    await runner.manager
      .getRepository(PageBlockOrmEntity)
      .update({ id: sourceBlockId }, { content: { text: 'v2 source' } });
    const createdResponse = await request(server)
      .post(`/templates/${templateId}/versions`)
      .expect(201);
    const created = createdResponse.body as TemplateVersionResponseDto;
    expect(created).toMatchObject({ version_number: 2, status: 'DRAFT' });
    expect(
      (await versionRepo.findById(
        created.id,
        runner.manager,
      ))!.getSnapshotHash(),
    ).not.toBe(initialHash);
    await request(server).post(`/templates/${templateId}/versions`).expect(409);
    const listResponse = await request(server)
      .get(`/templates/${templateId}/versions`)
      .expect(200);
    const list = listResponse.body as ListTemplateVersionsResponseDto;
    expect(list.items.map((v) => v.version_number)).toEqual([2, 1]);
    const previewResponse = await request(server)
      .get(`/templates/${templateId}/versions/${created.id}/preview`)
      .expect(200);
    const preview = previewResponse.body as TemplatePreviewResponseDto;
    const db = preview.databases[0];
    expect(preview.blocks).toHaveLength(3);
    expect(preview.databases).toHaveLength(1);
    expect(db).toMatchObject({
      version_id: created.id,
    });
    expect(db.properties).toHaveLength(5);
    expect(db.properties.flatMap((p) => p.options)).toHaveLength(6);
    expect(db.rows[0].values).toHaveLength(5);
    expect(db.views).toHaveLength(2);
    expect(db.views.flatMap((v) => v.properties)).toHaveLength(10);
    const parent = preview.blocks.find((b) => b.type === PageBlockType.TOGGLE)!;
    expect(parent.content).toEqual({ text: 'v2 source' });
    for (const block of preview.blocks.filter(
      (b) => b.type === PageBlockType.DATABASE_VIEW,
    )) {
      expect(block.parent_block_id).toBe(parent.id);
      expect(block.data_config).toMatchObject({
        database_id: db.id,
      });
      const config = block.data_config as { view_id: string };
      expect(db.views.map((v) => v.id)).toContain(config.view_id);
    }
    const ids = (p: TemplatePreviewResponseDto) => [
      ...p.blocks.map((b) => b.id),
      ...p.databases.flatMap((d) => [
        d.id,
        ...d.properties.flatMap((prop) => [
          prop.id,
          ...prop.options.map((o) => o.id),
        ]),
        ...d.rows.flatMap((r) => [r.id, ...r.values.map((v) => v.id)]),
        ...d.views.flatMap((v) => [
          v.id,
          ...v.properties.map((prop) => prop.id),
        ]),
      ]),
    ];
    expect(ids(preview).some((id) => ids(before).includes(id))).toBe(false);
    expect(
      db.rows[0].values.find(
        (v) => v.template_property_id === db.properties[0].id,
      )?.value,
    ).toBe(db.properties[0].options[0].id);
    expect(
      db.rows[0].values.find(
        (v) => v.template_property_id === db.properties[1].id,
      )?.value,
    ).toEqual(db.properties[1].options.map((o) => o.id));
    expect(
      db.rows[0].values.find(
        (v) => v.template_property_id === db.properties[2].id,
      )?.value,
    ).toBe(db.properties[2].options[1].id);
    const afterResponse = await request(server)
      .get(`/templates/${templateId}/versions/${initial.version.id}/preview`)
      .expect(200);
    expect(afterResponse.body).toEqual(before);
    await request(server)
      .post(`/templates/${templateId}/versions/${created.id}/publish`)
      .expect(201);
    const source = await pageReader.getPageSnapshot(
      sourcePageId,
      runner.manager,
    );
    const usedResponse = await request(server)
      .post(`/templates/${templateId}/versions/${created.id}/use`)
      .send({ workspace_id: source!.page.workspaceId })
      .expect(201);
    const used = usedResponse.body as UseTemplateResult;
    const livePage = await pageReader.getPageSnapshot(
      used.pageId,
      runner.manager,
    );
    expect(livePage!.blocks).toHaveLength(3);
    expect(
      livePage!.blocks.find((b) => b.type === PageBlockType.TOGGLE)?.content,
    ).toEqual({ text: 'v2 source' });
    const liveBlock = livePage!.blocks.find(
      (b) => b.type === PageBlockType.DATABASE_VIEW,
    )!;
    const config = liveBlock.dataConfig as {
      database_id: string;
      view_id: string;
    };
    expect(config.database_id).not.toBe(db.id);
    const liveDb = await databaseReader.getDatabaseSnapshot(
      config.database_id,
      runner.manager,
    );
    expect(liveDb!.properties).toHaveLength(5);
    expect(liveDb!.rows[0].values).toHaveLength(5);
    expect(liveDb!.views.map((v) => v.id)).toContain(config.view_id);
    await request(server).post(`/templates/${templateId}/versions`).expect(409);
  }, 30000);

  it.each(['row', 'option', 'view'])(
    'detects a database-only %s change over HTTP with unchanged Page blocks',
    async (kind) => {
      const server = app.getHttpServer() as Server;
      const pageBefore = await pageReader.getPageSnapshot(
        sourcePageId,
        runner.manager,
      );
      const latest = (await versionRepo.findLatestByTemplateId(
        templateId,
        runner.manager,
      ))!;
      const config = pageBefore!.blocks.find(
        (b) => b.type === PageBlockType.DATABASE_VIEW,
      )!.dataConfig as { database_id: string };
      const database = (await databaseReader.getDatabaseSnapshot(
        config.database_id,
        runner.manager,
      ))!;
      if (kind === 'row') {
        const person = database.properties.find(
          (p) => p.type === PropertyType.PERSON,
        )!;
        const value = database.rows[0].values.find(
          (v) => v.propertyId === person.id,
        )!;
        await runner.manager
          .getRepository(RowValueOrmEntity)
          .update({ id: value.id }, { value: ['changed-person-reference'] });
      } else if (kind === 'option') {
        await runner.manager
          .getRepository(PropertyOptionOrmEntity)
          .update(
            { id: database.properties[0].options[0].id },
            { name: 'Renamed option' },
          );
      } else {
        await runner.manager
          .getRepository(DatabaseViewOrmEntity)
          .update({ id: database.views[0].id }, { name: 'Renamed view' });
      }
      expect(
        await pageReader.getPageSnapshot(sourcePageId, runner.manager),
      ).toEqual(pageBefore);
      const response = await request(server)
        .post(`/templates/${templateId}/versions`)
        .expect(201);
      const created = response.body as TemplateVersionResponseDto;
      expect(created).toMatchObject({
        version_number: latest.getVersionNumber() + 1,
        status: 'DRAFT',
      });
      expect(
        (await versionRepo.findById(
          created.id,
          runner.manager,
        ))!.getSnapshotHash(),
      ).not.toBe(latest.getSnapshotHash());
      const counts = async () =>
        runner.manager.query<Record<string, number>[]>(
          `SELECT (SELECT count(*)::int FROM page_template_versions) AS versions,
        (SELECT count(*)::int FROM page_template_blocks) AS blocks,
        (SELECT count(*)::int FROM page_template_databases) AS databases,
        (SELECT count(*)::int FROM page_template_database_properties) AS properties,
        (SELECT count(*)::int FROM page_template_database_property_options) AS options,
        (SELECT count(*)::int FROM page_template_database_rows) AS rows,
        (SELECT count(*)::int FROM page_template_database_row_values) AS values,
        (SELECT count(*)::int FROM page_template_database_views) AS views,
        (SELECT count(*)::int FROM page_template_database_view_properties) AS view_properties`,
        );
      const before = await counts();
      await request(server)
        .post(`/templates/${templateId}/versions`)
        .expect(409);
      expect(await counts()).toEqual(before);
    },
  );

  it.each(['database', 'block'])(
    'rolls back real version and graph writes after a %s save failure',
    async (failure) => {
      await runner.manager
        .getRepository(PageBlockOrmEntity)
        .update(
          { id: sourceBlockId },
          { content: { text: `rollback ${failure}` } },
        );
      const before = await versionRepo.findByTemplateId(
        templateId,
        runner.manager,
      );
      const saveDatabases = databaseRepo.saveMany.bind(
        databaseRepo,
      ) as TypeOrmPageTemplateDatabaseSnapshotRepository['saveMany'];
      const saveBlocks = blockRepo.saveMany.bind(
        blockRepo,
      ) as TypeOrmPageTemplateBlockRepository['saveMany'];
      const spy =
        failure === 'database'
          ? jest
              .spyOn(databaseRepo, 'saveMany')
              .mockImplementationOnce(async (values, context) => {
                await saveDatabases(values, context);
                throw new Error('Injected persistence failure');
              })
          : jest
              .spyOn(blockRepo, 'saveMany')
              .mockImplementationOnce(async (values, context) => {
                await saveBlocks(values, context);
                throw new Error('Injected persistence failure');
              });
      try {
        await expect(
          createVersion.execute(
            new CreateTemplateVersionCommand(templateId, userId),
          ),
        ).rejects.toThrow('Injected persistence failure');
        expect(
          await versionRepo.findByTemplateId(templateId, runner.manager),
        ).toEqual(before);
        const rows = await runner.manager.query<{ count: string }[]>(
          'SELECT count(*) FROM page_template_databases d JOIN page_template_versions v ON v.id=d.version_id WHERE v.template_id=$1',
          [templateId],
        );
        expect(Number(rows[0].count)).toBe(before.length);
      } finally {
        spy.mockRestore();
      }
    },
  );

  it('serializes two real PostgreSQL transactions: one creates and the other gets 409', async () => {
    const page = await dataSource
      .getRepository(PageOrmEntity)
      .findOne({ where: {}, order: { id: 'ASC' } });
    if (!page) throw new Error('A committed local page fixture is required');
    const templates = new TypeOrmPageTemplateRepository(dataSource);
    const versions = new TypeOrmTemplateVersionRepository(dataSource);
    const template = PageTemplate.create({
      sourcePageId: page.id,
      workspaceId: page.workspace_id,
      name: 'Fingerprint concurrency fixture',
      createdBy: userId,
    });
    try {
      await templates.create(template);
      await versions.create(
        TemplateVersion.create({
          templateId: template.getId(),
          versionNumber: 1,
          createdBy: userId,
          snapshotHash: null,
        }),
      );
      // Immutable source fixture isolates template locking from live Page edits.
      // Repositories, transactions, locks, hash computation and writes are real.
      const source = {
        page: {
          id: page.id,
          workspaceId: page.workspace_id,
          title: page.title,
          icon: null,
          coverUrl: null,
        },
        blocks: [],
      };
      const service = new TemplateVersionContentSnapshotService(
        { getDatabaseSnapshot: jest.fn() },
        new TypeOrmPageTemplateBlockRepository(dataSource),
        new TypeOrmPageTemplateDatabaseSnapshotRepository(dataSource),
      );
      const handler = new CreateTemplateVersionHandler(
        templates,
        versions,
        new TypeOrmUnitOfWork(dataSource),
        {
          authorize: jest.fn().mockResolvedValue(true),
        } as unknown as AuthorizationService,
        { getPageSnapshot: jest.fn().mockResolvedValue(source) },
        service,
        new TemplateSnapshotFingerprintService(),
      );
      let firstLocked = () => {};
      let secondAttempted = () => {};
      let releaseFirst = () => {};
      const locked = new Promise<void>((resolve) => {
        firstLocked = resolve;
      });
      const attempted = new Promise<void>((resolve) => {
        secondAttempted = resolve;
      });
      const released = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      const originalLock = templates.findByIdForUpdate.bind(
        templates,
      ) as TypeOrmPageTemplateRepository['findByIdForUpdate'];
      let calls = 0;
      const spy = jest
        .spyOn(templates, 'findByIdForUpdate')
        .mockImplementation(async (id, context) => {
          const call = ++calls;
          if (call === 2) secondAttempted();
          const result = await originalLock(id, context);
          if (call === 1) {
            firstLocked();
            await released;
          }
          return result;
        });
      try {
        const first = handler.execute(
          new CreateTemplateVersionCommand(template.getId(), userId),
        );
        await locked;
        const second = handler.execute(
          new CreateTemplateVersionCommand(template.getId(), userId),
        );
        const resultsPromise = Promise.allSettled([first, second]);
        await attempted;
        releaseFirst();
        const results = await resultsPromise;
        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
        if (results[1].status === 'rejected') {
          const reason: unknown = results[1].reason;
          expect(reason).toBeInstanceOf(ConflictException);
        }
        const saved = await versions.findByTemplateId(template.getId());
        expect(saved.map((v) => v.getVersionNumber())).toEqual([1, 2]);
        expect(saved[1].getSnapshotHash()).toMatch(/^[a-f0-9]{64}$/);
      } finally {
        releaseFirst();
        spy.mockRestore();
      }
    } finally {
      await dataSource
        .getRepository(PageTemplateOrmEntity)
        .delete(template.getId());
      expect(await versions.findByTemplateId(template.getId())).toEqual([]);
    }
  }, 30000);
});
