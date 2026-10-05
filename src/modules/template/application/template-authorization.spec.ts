/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method, @typescript-eslint/require-await */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { ContentPageProvisioningPort } from 'src/modules/content/application/ports/content-page-provisioning.port';
import type { ContentPageSnapshotReaderPort } from 'src/modules/content/application/ports/content-page-snapshot-reader.port';
import type { DatabaseProvisioningPort } from 'src/modules/database/application/ports/database-provisioning.port';
import type { DatabaseSnapshotReaderPort } from 'src/modules/database/application/ports/database-snapshot-reader.port';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageTemplate } from '../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../domain/aggregates/template-version/template-version.aggregate';
import { TemplateStatus } from '../domain/enums/template-status.enum';
import { TemplateVisibility } from '../domain/enums/template-visibility.enum';
import type { PageTemplateBlockRepository } from '../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../domain/repositories/template-version.repository';

import { ArchivePageTemplateCommand } from './commands/page-template/archive-page-template/archive-page-template.command';
import { ArchivePageTemplateHandler } from './commands/page-template/archive-page-template/archive-page-template.handler';
import { CreatePageTemplateCommand } from './commands/page-template/create-page-template/create-page-template.command';
import { CreatePageTemplateHandler } from './commands/page-template/create-page-template/create-page-template.handler';
import { RestorePageTemplateCommand } from './commands/page-template/restore-page-template/restore-page-template.command';
import { RestorePageTemplateHandler } from './commands/page-template/restore-page-template/restore-page-template.handler';
import { UpdatePageTemplateCommand } from './commands/page-template/update-page-template/update-page-template.command';
import { UpdatePageTemplateHandler } from './commands/page-template/update-page-template/update-page-template.handler';
import { UseTemplateCommand } from './commands/page-template/use-template/use-template.command';
import { UseTemplateHandler } from './commands/page-template/use-template/use-template.handler';
import { PublishTemplateVersionCommand } from './commands/template-version/publish-template-version/publish-template-version.command';
import { PublishTemplateVersionHandler } from './commands/template-version/publish-template-version/publish-template-version.handler';
import { GetTemplatePreviewHandler } from './queries/template-preview/get-template-preview/get-template-preview.handler';
import { TemplateVersionContentSnapshotService } from './services/template-version-content-snapshot.service';
import { GetTemplatePreviewQuery } from './queries/template-preview/get-template-preview/get-template-preview.query';

describe('Template Module Authorization Integration Tests', () => {
  const fakeUnitOfWork: UnitOfWork = {
    runInTransaction: jest.fn((work) => work({} as any)),
  };

  const createFakeTemplate = (
    overrides?: Partial<{
      id: string;
      workspaceId: string;
      createdBy: string;
      visibility: TemplateVisibility;
      status: TemplateStatus;
      name: string;
    }>,
  ) =>
    PageTemplate.restore({
      id: overrides?.id ?? 'template-1',
      sourcePageId: 'page-1',
      workspaceId: overrides?.workspaceId ?? 'workspace-1',
      name: overrides?.name ?? 'Test Template',
      description: null,
      icon: null,
      coverUrl: null,
      createdBy: overrides?.createdBy ?? 'creator-user',
      status: overrides?.status ?? TemplateStatus.PUBLISHED,
      visibility: overrides?.visibility ?? TemplateVisibility.PRIVATE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const createFakeVersion = (
    overrides?: Partial<{
      id: string;
      templateId: string;
      versionNumber: number;
      createdBy: string;
      isPublished: boolean;
    }>,
  ) => {
    const version = TemplateVersion.create({
      id: overrides?.id ?? 'version-1',
      templateId: overrides?.templateId ?? 'template-1',
      versionNumber: overrides?.versionNumber ?? 1,
      createdBy: overrides?.createdBy ?? 'creator-user',
    });
    if (overrides?.isPublished) {
      version.publish();
    }
    return version;
  };

  describe('Create Template Authorization', () => {
    let handler: CreatePageTemplateHandler;
    let pageSnapshotReader: jest.Mocked<ContentPageSnapshotReaderPort>;
    let databaseSnapshotReader: jest.Mocked<DatabaseSnapshotReaderPort>;
    let pageTemplateRepo: jest.Mocked<PageTemplateRepository>;
    let templateVersionRepo: jest.Mocked<TemplateVersionRepository>;
    let pageTemplateBlockRepo: jest.Mocked<PageTemplateBlockRepository>;
    let templateDatabaseSnapshotRepo: jest.Mocked<PageTemplateDatabaseSnapshotRepository>;
    let authorizationService: jest.Mocked<AuthorizationService>;

    beforeEach(() => {
      pageSnapshotReader = {
        getPageSnapshot: jest.fn(),
      } as any;
      databaseSnapshotReader = {
        getDatabaseSnapshot: jest.fn(),
      } as any;
      pageTemplateRepo = {
        create: jest.fn().mockImplementation((tpl) => Promise.resolve(tpl)),
      } as any;
      templateVersionRepo = {
        create: jest.fn().mockImplementation((ver) => Promise.resolve(ver)),
      } as any;
      pageTemplateBlockRepo = {
        saveMany: jest.fn().mockResolvedValue([]),
      } as any;
      templateDatabaseSnapshotRepo = {
        saveMany: jest.fn().mockResolvedValue(undefined),
      } as any;
      authorizationService = {
        authorize: jest.fn(),
      } as any;

      handler = new CreatePageTemplateHandler(
        pageSnapshotReader,
        pageTemplateRepo,
        templateVersionRepo,
        fakeUnitOfWork,
        authorizationService,
        new TemplateVersionContentSnapshotService(
          databaseSnapshotReader,
          pageTemplateBlockRepo,
          templateDatabaseSnapshotRepo,
        ),
      );
    });

    it('rejects when source page does not exist with NotFoundException', async () => {
      pageSnapshotReader.getPageSnapshot.mockResolvedValue(null);

      await expect(
        handler.execute(
          new CreatePageTemplateCommand('non-existent', 'user-1'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(pageTemplateRepo.create).not.toHaveBeenCalled();
    });

    it('rejects when user does not have PAGE_READ on source page', async () => {
      pageSnapshotReader.getPageSnapshot.mockResolvedValue({
        page: {
          id: 'page-1',
          workspaceId: 'ws-1',
          title: 'Secret Page',
          icon: null,
          coverUrl: null,
        },
        blocks: [],
      });

      authorizationService.authorize.mockImplementation(async (params) => {
        if (params.target.type === 'page') return false;
        return true;
      });

      await expect(
        handler.execute(
          new CreatePageTemplateCommand('page-1', 'user-unauthorized'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageTemplateRepo.create).not.toHaveBeenCalled();
      expect(templateVersionRepo.create).not.toHaveBeenCalled();
    });

    it('rejects when user has PAGE_READ but lacks WORKSPACE_READ (e.g. guest) in source workspace', async () => {
      pageSnapshotReader.getPageSnapshot.mockResolvedValue({
        page: {
          id: 'page-1',
          workspaceId: 'ws-1',
          title: 'Guest Page',
          icon: null,
          coverUrl: null,
        },
        blocks: [],
      });

      authorizationService.authorize.mockImplementation(async (params) => {
        if (
          params.target.type === 'page' &&
          params.permissions.includes(PERMISSIONS.PAGE_READ)
        )
          return true;
        if (
          params.target.type === 'workspace' &&
          params.permissions.includes(PERMISSIONS.WORKSPACE_READ)
        )
          return false;
        return false;
      });

      await expect(
        handler.execute(new CreatePageTemplateCommand('page-1', 'guest-user')),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageTemplateRepo.create).not.toHaveBeenCalled();
    });

    it('succeeds when user has both PAGE_READ and WORKSPACE_READ on source page and workspace', async () => {
      pageSnapshotReader.getPageSnapshot.mockResolvedValue({
        page: {
          id: 'page-1',
          workspaceId: 'ws-1',
          title: 'My Page',
          icon: null,
          coverUrl: null,
        },
        blocks: [],
      });

      authorizationService.authorize.mockResolvedValue(true);

      const result = await handler.execute(
        new CreatePageTemplateCommand('page-1', 'member-user', 'My Template'),
      );

      expect(result.template).toBeDefined();
      expect(result.template.name).toBe('My Template');
      expect(pageTemplateRepo.create).toHaveBeenCalled();
      expect(templateVersionRepo.create).toHaveBeenCalled();
    });
  });

  describe('Use Template Authorization (2-Boundary Security)', () => {
    let handler: UseTemplateHandler;
    let pageTemplateRepo: jest.Mocked<PageTemplateRepository>;
    let templateVersionRepo: jest.Mocked<TemplateVersionRepository>;
    let pageTemplateBlockRepo: jest.Mocked<PageTemplateBlockRepository>;
    let templateDatabaseSnapshotRepo: jest.Mocked<PageTemplateDatabaseSnapshotRepository>;
    let pageProvisioningPort: jest.Mocked<ContentPageProvisioningPort>;
    let databaseProvisioning: jest.Mocked<DatabaseProvisioningPort>;
    let authorizationService: jest.Mocked<AuthorizationService>;

    beforeEach(() => {
      pageTemplateRepo = {
        findById: jest.fn(),
      } as any;
      templateVersionRepo = {
        findById: jest.fn(),
      } as any;
      pageTemplateBlockRepo = {
        findByVersionId: jest.fn().mockResolvedValue([]),
      } as any;
      templateDatabaseSnapshotRepo = {
        findByVersionId: jest.fn().mockResolvedValue([]),
      } as any;
      pageProvisioningPort = {
        createPageShell: jest.fn().mockResolvedValue({ pageId: 'new-page-id' }),
        createBlocksFromSnapshot: jest.fn().mockResolvedValue(undefined),
      } as any;
      databaseProvisioning = {
        provisionDatabases: jest.fn().mockResolvedValue({
          databaseIdMap: new Map(),
          viewIdMap: new Map(),
        }),
      } as any;
      authorizationService = {
        authorize: jest.fn(),
      } as any;

      handler = new UseTemplateHandler(
        pageTemplateRepo,
        templateVersionRepo,
        pageTemplateBlockRepo,
        templateDatabaseSnapshotRepo,
        pageProvisioningPort,
        databaseProvisioning,
        fakeUnitOfWork,
        authorizationService,
      );
    });

    it('rejects when template is not found', async () => {
      pageTemplateRepo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(
          new UseTemplateCommand('missing-tpl', 'v-1', 'ws-dest', 'user-1'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('rejects when template is ARCHIVED with BadRequestException', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ status: TemplateStatus.ARCHIVED }),
      );

      await expect(
        handler.execute(
          new UseTemplateCommand('tpl-1', 'v-1', 'ws-dest', 'user-1'),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('rejects when source template is PRIVATE and user is not creator or workspace owner', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.PRIVATE,
          createdBy: 'owner-1',
          workspaceId: 'ws-src',
        }),
      );

      // Not workspace owner
      authorizationService.authorize.mockResolvedValue(false);

      await expect(
        handler.execute(
          new UseTemplateCommand('tpl-1', 'v-1', 'ws-dest', 'unrelated-user'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
      expect(databaseProvisioning.provisionDatabases).not.toHaveBeenCalled();
    });

    it('rejects when source template is WORKSPACE and user is not in source workspace', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.WORKSPACE,
          workspaceId: 'ws-src',
        }),
      );

      authorizationService.authorize.mockImplementation(async (params) => {
        if (params.target.id === 'ws-src') return false;
        return true;
      });

      await expect(
        handler.execute(
          new UseTemplateCommand('tpl-1', 'v-1', 'ws-dest', 'user-outside'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('rejects when version is DRAFT before destination creation', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ visibility: TemplateVisibility.PUBLIC }),
      );
      templateVersionRepo.findById.mockResolvedValue(
        createFakeVersion({ isPublished: false }), // Draft
      );

      await expect(
        handler.execute(
          new UseTemplateCommand('tpl-1', 'v-1', 'ws-dest', 'user-1'),
        ),
      ).rejects.toThrow('Only published template versions can be used');

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
      expect(databaseProvisioning.provisionDatabases).not.toHaveBeenCalled();
    });

    it('rejects when user has template access BUT lacks PAGE_CREATE in destination workspace', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.PUBLIC,
          workspaceId: 'ws-src',
        }),
      );
      templateVersionRepo.findById.mockResolvedValue(
        createFakeVersion({ isPublished: true }),
      );

      authorizationService.authorize.mockImplementation(async (params) => {
        // Destination workspace check fails
        if (
          params.target.id === 'ws-dest' &&
          params.permissions.includes(PERMISSIONS.PAGE_CREATE)
        ) {
          return false;
        }
        return true;
      });

      await expect(
        handler.execute(
          new UseTemplateCommand('tpl-1', 'v-1', 'ws-dest', 'user-1'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
      expect(databaseProvisioning.provisionDatabases).not.toHaveBeenCalled();
      expect(
        pageProvisioningPort.createBlocksFromSnapshot,
      ).not.toHaveBeenCalled();
    });

    it('succeeds cross-workspace when template is PUBLIC and user has PAGE_CREATE in destination workspace B', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.PUBLIC,
          workspaceId: 'workspace-A',
        }),
      );
      templateVersionRepo.findById.mockResolvedValue(
        createFakeVersion({ isPublished: true }),
      );

      authorizationService.authorize.mockImplementation(async (params) => {
        // Destination workspace B check passes
        if (
          params.target.id === 'workspace-B' &&
          params.permissions.includes(PERMISSIONS.PAGE_CREATE)
        ) {
          return true;
        }
        return false;
      });

      const result = await handler.execute(
        new UseTemplateCommand(
          'tpl-1',
          'v-1',
          'workspace-B',
          'user-permitted-in-B',
        ),
      );

      expect(result.pageId).toBe('new-page-id');
      expect(pageProvisioningPort.createPageShell).toHaveBeenCalledWith(
        expect.objectContaining({ workspaceId: 'workspace-B' }),
        expect.anything(),
      );
      expect(databaseProvisioning.provisionDatabases).toHaveBeenCalled();
      expect(pageProvisioningPort.createBlocksFromSnapshot).toHaveBeenCalled();
    });
  });

  describe('Publish Template Version Authorization', () => {
    let handler: PublishTemplateVersionHandler;
    let pageTemplateRepo: jest.Mocked<PageTemplateRepository>;
    let templateVersionRepo: jest.Mocked<TemplateVersionRepository>;
    let authorizationService: jest.Mocked<AuthorizationService>;

    beforeEach(() => {
      pageTemplateRepo = {
        findById: jest.fn(),
      } as any;
      templateVersionRepo = {
        findByIdForUpdate: jest.fn(),
        save: jest.fn().mockImplementation((ver) => Promise.resolve(ver)),
      } as any;
      authorizationService = {
        authorize: jest.fn(),
      } as any;

      handler = new PublishTemplateVersionHandler(
        pageTemplateRepo,
        templateVersionRepo,
        fakeUnitOfWork,
        authorizationService,
      );
    });

    it('rejects when template is not found with NotFoundException', async () => {
      pageTemplateRepo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(
          new PublishTemplateVersionCommand('tpl-missing', 'ver-1', 'user-1'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when caller is neither creator nor workspace owner', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ createdBy: 'creator-user', workspaceId: 'ws-1' }),
      );
      authorizationService.authorize.mockResolvedValue(false); // not owner

      await expect(
        handler.execute(
          new PublishTemplateVersionCommand(
            'template-1',
            'version-1',
            'regular-member',
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(templateVersionRepo.save).not.toHaveBeenCalled();
    });

    it('succeeds when caller is the creator of the template', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ createdBy: 'creator-user', workspaceId: 'ws-1' }),
      );
      const version = createFakeVersion({
        templateId: 'template-1',
        isPublished: false,
      });
      templateVersionRepo.findByIdForUpdate.mockResolvedValue(version);

      const result = await handler.execute(
        new PublishTemplateVersionCommand(
          'template-1',
          'version-1',
          'creator-user',
        ),
      );

      expect(result).toBeDefined();
      expect(templateVersionRepo.save).toHaveBeenCalled();
    });

    it('succeeds when caller is workspace owner even if not creator', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ createdBy: 'creator-user', workspaceId: 'ws-1' }),
      );
      const version = createFakeVersion({
        templateId: 'template-1',
        isPublished: false,
      });
      templateVersionRepo.findByIdForUpdate.mockResolvedValue(version);

      // Caller is workspace owner
      authorizationService.authorize.mockImplementation(async (params) => {
        if (params.permissions.includes(PERMISSIONS.WORKSPACE_UPDATE))
          return true;
        return false;
      });

      const result = await handler.execute(
        new PublishTemplateVersionCommand(
          'template-1',
          'version-1',
          'workspace-owner-user',
        ),
      );

      expect(result).toBeDefined();
      expect(templateVersionRepo.save).toHaveBeenCalled();
    });
  });

  describe('Get Template Preview & Draft Leakage Protection', () => {
    let handler: GetTemplatePreviewHandler;
    let pageTemplateRepo: jest.Mocked<PageTemplateRepository>;
    let templateVersionRepo: jest.Mocked<TemplateVersionRepository>;
    let pageTemplateBlockRepo: jest.Mocked<PageTemplateBlockRepository>;
    let authorizationService: jest.Mocked<AuthorizationService>;

    beforeEach(() => {
      pageTemplateRepo = {
        findById: jest.fn(),
      } as any;
      templateVersionRepo = {
        findById: jest.fn(),
      } as any;
      pageTemplateBlockRepo = {
        findByVersionId: jest.fn().mockResolvedValue([]),
      } as any;
      authorizationService = {
        authorize: jest.fn(),
      } as any;

      handler = new GetTemplatePreviewHandler(
        pageTemplateRepo,
        templateVersionRepo,
        pageTemplateBlockRepo,
        authorizationService,
        {
          findByVersionId: jest.fn().mockResolvedValue([]),
        } as unknown as PageTemplateDatabaseSnapshotRepository,
      );
    });

    it('rejects preview of PRIVATE template for unrelated user', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.PRIVATE,
          createdBy: 'creator-user',
          workspaceId: 'ws-1',
        }),
      );
      authorizationService.authorize.mockResolvedValue(false);

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery('template-1', 'v-1', 'stranger-user'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageTemplateBlockRepo.findByVersionId).not.toHaveBeenCalled();
    });

    it('rejects preview of DRAFT version of PUBLIC template for non-creator/non-owner', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.PUBLIC,
          createdBy: 'creator-user',
          workspaceId: 'ws-1',
        }),
      );
      templateVersionRepo.findById.mockResolvedValue(
        createFakeVersion({
          templateId: 'template-1',
          isPublished: false, // DRAFT
          createdBy: 'creator-user',
        }),
      );
      authorizationService.authorize.mockResolvedValue(false);

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery('template-1', 'version-1', 'random-user'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageTemplateBlockRepo.findByVersionId).not.toHaveBeenCalled();
    });

    it('allows preview of DRAFT version for the creator', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.PUBLIC,
          createdBy: 'creator-user',
        }),
      );
      templateVersionRepo.findById.mockResolvedValue(
        createFakeVersion({
          templateId: 'template-1',
          isPublished: false,
          createdBy: 'creator-user',
        }),
      );

      const result = await handler.execute(
        new GetTemplatePreviewQuery('template-1', 'version-1', 'creator-user'),
      );

      expect(result).toBeDefined();
      expect(result.template.id).toBe('template-1');
      expect(pageTemplateBlockRepo.findByVersionId).toHaveBeenCalled();
    });

    it('allows preview of PUBLISHED version of PUBLIC template for any authenticated user', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({
          visibility: TemplateVisibility.PUBLIC,
          createdBy: 'creator-user',
        }),
      );
      templateVersionRepo.findById.mockResolvedValue(
        createFakeVersion({
          templateId: 'template-1',
          isPublished: true,
          createdBy: 'creator-user',
        }),
      );

      const result = await handler.execute(
        new GetTemplatePreviewQuery('template-1', 'version-1', 'any-user'),
      );

      expect(result).toBeDefined();
      expect(result.template.id).toBe('template-1');
    });
  });

  describe('Update, Archive, Restore Template Authorization', () => {
    let updateHandler: UpdatePageTemplateHandler;
    let archiveHandler: ArchivePageTemplateHandler;
    let restoreHandler: RestorePageTemplateHandler;
    let pageTemplateRepo: jest.Mocked<PageTemplateRepository>;
    let authorizationService: jest.Mocked<AuthorizationService>;

    beforeEach(() => {
      pageTemplateRepo = {
        findById: jest.fn(),
        save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
      } as any;
      authorizationService = {
        authorize: jest.fn(),
      } as any;

      updateHandler = new UpdatePageTemplateHandler(
        pageTemplateRepo,
        authorizationService,
      );
      archiveHandler = new ArchivePageTemplateHandler(
        pageTemplateRepo,
        authorizationService,
      );
      restoreHandler = new RestorePageTemplateHandler(
        pageTemplateRepo,
        authorizationService,
      );
    });

    it('rejects update when user is neither creator nor workspace owner', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ createdBy: 'creator-1', workspaceId: 'ws-1' }),
      );
      authorizationService.authorize.mockResolvedValue(false);

      await expect(
        updateHandler.execute(
          new UpdatePageTemplateCommand('tpl-1', 'other-user', 'New Name'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageTemplateRepo.save).not.toHaveBeenCalled();
    });

    it('rejects archive when user is unauthorized', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ createdBy: 'creator-1', workspaceId: 'ws-1' }),
      );
      authorizationService.authorize.mockResolvedValue(false);

      await expect(
        archiveHandler.execute(
          new ArchivePageTemplateCommand('tpl-1', 'other-user'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageTemplateRepo.save).not.toHaveBeenCalled();
    });

    it('rejects restore when user is unauthorized', async () => {
      pageTemplateRepo.findById.mockResolvedValue(
        createFakeTemplate({ createdBy: 'creator-1', workspaceId: 'ws-1' }),
      );
      authorizationService.authorize.mockResolvedValue(false);

      await expect(
        restoreHandler.execute(
          new RestorePageTemplateCommand('tpl-1', 'other-user'),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(pageTemplateRepo.save).not.toHaveBeenCalled();
    });

    it('allows creator to update, archive, and restore template', async () => {
      const template = createFakeTemplate({
        createdBy: 'creator-1',
        workspaceId: 'ws-1',
      });
      pageTemplateRepo.findById.mockResolvedValue(template);

      await updateHandler.execute(
        new UpdatePageTemplateCommand('tpl-1', 'creator-1', 'Updated Name'),
      );
      expect(template.getName()).toBe('Updated Name');

      await archiveHandler.execute(
        new ArchivePageTemplateCommand('tpl-1', 'creator-1'),
      );
      expect(template.getStatus()).toBe(TemplateStatus.ARCHIVED);

      await restoreHandler.execute(
        new RestorePageTemplateCommand('tpl-1', 'creator-1'),
      );
      expect(template.getStatus()).toBe(TemplateStatus.DRAFT);
    });
  });
});
