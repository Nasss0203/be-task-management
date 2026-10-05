/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type {
  ContentPageSnapshot,
  ContentPageSnapshotReaderPort,
} from 'src/modules/content/application/ports/content-page-snapshot-reader.port';
import type { DatabaseSnapshotReaderPort } from 'src/modules/database/application/ports/database-snapshot-reader.port';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import { TemplateSnapshotFingerprintService } from '../../../services/template-snapshot-fingerprint.service';
import { TemplateVersionContentSnapshotService } from '../../../services/template-version-content-snapshot.service';
import { CreatePageTemplateHandler } from '../../page-template/create-page-template/create-page-template.handler';
import { CreatePageTemplateCommand } from '../../page-template/create-page-template/create-page-template.command';
import { CreateTemplateVersionCommand } from './create-template-version.command';
import { CreateTemplateVersionHandler } from './create-template-version.handler';

describe('CreateTemplateVersionHandler change detection', () => {
  const context = {} as PersistenceContext;
  let template: PageTemplate;
  let latest: TemplateVersion | null;
  let source: ContentPageSnapshot;
  let templates: jest.Mocked<PageTemplateRepository>;
  let versions: jest.Mocked<TemplateVersionRepository>;
  let pages: jest.Mocked<ContentPageSnapshotReaderPort>;
  let databases: jest.Mocked<DatabaseSnapshotReaderPort>;
  let blocks: jest.Mocked<PageTemplateBlockRepository>;
  let graphs: jest.Mocked<PageTemplateDatabaseSnapshotRepository>;
  let auth: jest.Mocked<AuthorizationService>;
  let uow: UnitOfWork;
  let snapshots: TemplateVersionContentSnapshotService;
  let fingerprint: TemplateSnapshotFingerprintService;
  let handler: CreateTemplateVersionHandler;

  beforeEach(() => {
    template = PageTemplate.create({
      id: 'template',
      sourcePageId: 'page',
      workspaceId: 'workspace',
      name: 'Template',
      createdBy: 'creator',
    });
    source = {
      page: {
        id: 'page',
        workspaceId: 'workspace',
        title: 'Page',
        icon: null,
        coverUrl: null,
      },
      blocks: [
        {
          sourceId: 'block',
          parentSourceId: null,
          type: PageBlockType.TOGGLE,
          title: null,
          positionX: null,
          positionY: null,
          width: null,
          height: null,
          orderIndex: 0,
          content: { text: 'Hello' },
          styleConfig: null,
          dataConfig: null,
          isOpen: true,
        },
      ],
    };
    latest = TemplateVersion.create({
      templateId: 'template',
      versionNumber: 1,
      createdBy: 'creator',
    });
    templates = {
      findByIdForUpdate: jest
        .fn()
        .mockImplementation(() => Promise.resolve(template)),
      create: jest.fn().mockImplementation((t: PageTemplate) => {
        template = t;
        return Promise.resolve(t);
      }),
    } as unknown as jest.Mocked<PageTemplateRepository>;
    versions = {
      findLatestByTemplateId: jest
        .fn()
        .mockImplementation(() => Promise.resolve(latest)),
      getNextVersionNumber: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve((latest?.getVersionNumber() ?? 0) + 1),
        ),
      create: jest.fn().mockImplementation((v: TemplateVersion) => {
        latest = v;
        return Promise.resolve(v);
      }),
    } as unknown as jest.Mocked<TemplateVersionRepository>;
    pages = {
      getPageSnapshot: jest
        .fn()
        .mockImplementation(() => Promise.resolve(source)),
    };
    databases = { getDatabaseSnapshot: jest.fn() };
    blocks = {
      saveMany: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<PageTemplateBlockRepository>;
    graphs = {
      saveMany: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PageTemplateDatabaseSnapshotRepository>;
    auth = {
      authorize: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<AuthorizationService>;
    uow = { runInTransaction: (work) => work(context) };
    snapshots = new TemplateVersionContentSnapshotService(
      databases,
      blocks,
      graphs,
    );
    fingerprint = new TemplateSnapshotFingerprintService();
    handler = new CreateTemplateVersionHandler(
      templates,
      versions,
      uow,
      auth,
      pages,
      snapshots,
      fingerprint,
    );
  });

  const command = () => new CreateTemplateVersionCommand('template', 'creator');

  it('rejects equal hash before numbering or any persistence', async () => {
    latest = TemplateVersion.create({
      templateId: 'template',
      versionNumber: 1,
      createdBy: 'other',
      snapshotHash: fingerprint.compute({
        blocks: source.blocks,
        databases: [],
      }),
    });
    latest.publish();
    await expect(handler.execute(command())).rejects.toThrow(
      new ConflictException(
        'No changes detected since the latest template version',
      ),
    );
    expect(templates.findByIdForUpdate).toHaveBeenCalledWith(
      'template',
      context,
    );
    expect(versions.findLatestByTemplateId).toHaveBeenCalledWith(
      'template',
      context,
    );
    expect(versions.getNextVersionNumber).not.toHaveBeenCalled();
    expect(versions.create).not.toHaveBeenCalled();
    expect(blocks.saveMany).not.toHaveBeenCalled();
    expect(graphs.saveMany).not.toHaveBeenCalled();
    expect(pages.getPageSnapshot).toHaveBeenCalledTimes(1);
  });

  it.each(['different', 'legacy', 'absent'])(
    'creates a hashed DRAFT when latest is %s',
    async (kind) => {
      latest =
        kind === 'absent'
          ? null
          : TemplateVersion.create({
              templateId: 'template',
              versionNumber: 1,
              createdBy: 'creator',
              snapshotHash: kind === 'different' ? 'a'.repeat(64) : null,
            });
      const result = await handler.execute(command());
      expect(result).toMatchObject({
        version_number: kind === 'absent' ? 1 : 2,
        status: 'DRAFT',
      });
      expect(latest!.getSnapshotHash()).toBe(
        fingerprint.compute({ blocks: source.blocks, databases: [] }),
      );
      expect(blocks.saveMany).toHaveBeenCalledTimes(1);
      await expect(handler.execute(command())).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(versions.create).toHaveBeenCalledTimes(1);
    },
  );

  it('fingerprints new v1 and immediately rejects duplicate v2; allows page-only change', async () => {
    const create = new CreatePageTemplateHandler(
      pages,
      templates,
      versions,
      uow,
      auth,
      snapshots,
      fingerprint,
    );
    const initial = await create.execute(
      new CreatePageTemplateCommand('page', 'creator'),
    );
    expect(initial.version.version_number).toBe(1);
    const hash = latest!.getSnapshotHash();
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    await expect(
      handler.execute(
        new CreateTemplateVersionCommand(template.getId(), 'creator'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    source.blocks[0].content = { text: 'Changed' };
    await handler.execute(
      new CreateTemplateVersionCommand(template.getId(), 'creator'),
    );
    expect(latest!.getSnapshotHash()).not.toBe(hash);
  });

  it.each([false, true])(
    'keeps source read permissions for creator (denied workspace=%s)',
    async (workspaceDenied) => {
      auth.authorize
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(workspaceDenied)
        .mockResolvedValueOnce(false);
      await expect(handler.execute(command())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(versions.findLatestByTemplateId).not.toHaveBeenCalled();
    },
  );

  it('rejects noncreator without owner permission', async () => {
    auth.authorize.mockResolvedValue(false);
    await expect(
      handler.execute(new CreateTemplateVersionCommand('template', 'stranger')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(pages.getPageSnapshot).not.toHaveBeenCalled();
  });

  it('allows workspace owner and rejects missing source', async () => {
    await handler.execute(
      new CreateTemplateVersionCommand('template', 'owner'),
    );
    pages.getPageSnapshot.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      NotFoundException,
    );
    templates.findByIdForUpdate.mockResolvedValue(null);
    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a detached source and archived templates', async () => {
    template = PageTemplate.create({
      sourcePageId: null,
      workspaceId: 'workspace',
      name: 'Detached',
      createdBy: 'creator',
    });
    await expect(handler.execute(command())).rejects.toBeInstanceOf(
      BadRequestException,
    );
    template.archive();
    await expect(handler.execute(command())).rejects.toThrow();
    expect(versions.create).not.toHaveBeenCalled();
  });
});
