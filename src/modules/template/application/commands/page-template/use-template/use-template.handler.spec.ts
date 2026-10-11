/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/require-await */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { ContentPageProvisioningPort } from 'src/modules/content/application/ports/content-page-provisioning.port';
import type { DatabaseProvisioningPort } from 'src/modules/database/application/ports/database-provisioning.port';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { PageTemplateDatabase } from '../../../../domain/aggregates/template-database/page-template-database.aggregate';
import { PageTemplateDatabaseView } from '../../../../domain/aggregates/template-database/page-template-database-view.entity';
import { TemplateEntitlement } from '../../../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateBlock } from '../../../../domain/entities/page-template-block.entity';
import { TemplateEntitlementSource } from '../../../../domain/enums/template-entitlement-source.enum';
import { TemplateListingStatus } from '../../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateEntitlementRepository } from '../../../../domain/repositories/template-entitlement.repository';
import type { TemplateListingRepository } from '../../../../domain/repositories/template-listing.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { UseTemplateCommand } from './use-template.command';
import { UseTemplateHandler } from './use-template.handler';

describe('UseTemplateHandler Regression Tests', () => {
  let pageTemplateRepository: jest.Mocked<PageTemplateRepository>;
  let templateVersionRepository: jest.Mocked<TemplateVersionRepository>;
  let pageTemplateBlockRepository: jest.Mocked<PageTemplateBlockRepository>;
  let templateDatabaseSnapshotRepository: jest.Mocked<PageTemplateDatabaseSnapshotRepository>;
  let templateEntitlementRepository: jest.Mocked<TemplateEntitlementRepository>;
  let templateListingRepository: jest.Mocked<TemplateListingRepository>;
  let pageProvisioningPort: jest.Mocked<ContentPageProvisioningPort>;
  let databaseProvisioning: jest.Mocked<DatabaseProvisioningPort>;
  let uow: jest.Mocked<UnitOfWork>;
  let authorizationService: jest.Mocked<AuthorizationService>;

  let handler: UseTemplateHandler;

  const mockContext = {
    id: 'test-persistence-context',
  } as PersistenceContext;

  const templateId = 'template-uuid-1';
  const versionId = 'version-uuid-1';
  const sourceWorkspaceId = 'source-workspace-uuid';
  const destinationWorkspaceId = 'dest-workspace-uuid';
  const creatorId = 'creator-uuid-1';
  const claimingUserId = 'user-b-uuid';
  const newPageId = 'new-cloned-page-uuid';

  const createTemplate = (params?: {
    visibility?: TemplateVisibility;
    status?: TemplateStatus;
    createdBy?: string;
    workspaceId?: string;
  }) =>
    PageTemplate.restore({
      id: templateId,
      sourcePageId: 'source-page-1',
      workspaceId: params?.workspaceId ?? sourceWorkspaceId,
      name: 'Original Template Name',
      description: 'Template Description',
      icon: 'icon-sparkle',
      coverUrl: 'https://example.com/cover.png',
      createdBy: params?.createdBy ?? creatorId,
      status: params?.status ?? TemplateStatus.PUBLISHED,
      visibility: params?.visibility ?? TemplateVisibility.PUBLIC,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

  const createVersion = (params?: {
    published?: boolean;
    templateIdOverride?: string;
  }) => {
    const version = TemplateVersion.create({
      id: versionId,
      templateId: params?.templateIdOverride ?? templateId,
      versionNumber: 1,
      createdBy: creatorId,
    });
    if (params?.published !== false) {
      version.publish();
    }
    return version;
  };

  const createListing = (status = TemplateListingStatus.PUBLISHED) =>
    TemplateListing.restore({
      id: 'listing-uuid-1',
      templateId,
      offerType: TemplateOfferType.FREE,
      status,
      createdBy: creatorId,
      publishedAt:
        status === TemplateListingStatus.PUBLISHED ? new Date() : null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

  const createEntitlement = (userId = claimingUserId) =>
    TemplateEntitlement.restore({
      id: 'entitlement-uuid-1',
      templateId,
      userId,
      source: TemplateEntitlementSource.FREE_CLAIM,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });

  beforeEach(() => {
    pageTemplateRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<PageTemplateRepository>;

    templateVersionRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<TemplateVersionRepository>;

    pageTemplateBlockRepository = {
      findByVersionId: jest.fn(),
    } as unknown as jest.Mocked<PageTemplateBlockRepository>;

    templateDatabaseSnapshotRepository = {
      findByVersionId: jest.fn(),
    } as unknown as jest.Mocked<PageTemplateDatabaseSnapshotRepository>;

    templateEntitlementRepository = {
      findByTemplateAndUser: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<TemplateEntitlementRepository>;

    templateListingRepository = {
      findByTemplateId: jest.fn(),
    } as unknown as jest.Mocked<TemplateListingRepository>;

    pageProvisioningPort = {
      createPageShell: jest.fn().mockResolvedValue({ pageId: newPageId }),
      createBlocksFromSnapshot: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ContentPageProvisioningPort>;

    databaseProvisioning = {
      provisionDatabases: jest.fn().mockResolvedValue({
        databaseIdMap: new Map(),
        propertyIdMap: new Map(),
        optionIdMap: new Map(),
        rowIdMap: new Map(),
        viewIdMap: new Map(),
      }),
    } as unknown as jest.Mocked<DatabaseProvisioningPort>;

    uow = {
      runInTransaction: jest
        .fn()
        .mockImplementation((fn: (ctx: PersistenceContext) => unknown) =>
          fn(mockContext),
        ),
    };

    authorizationService = {
      authorize: jest.fn(),
    } as unknown as jest.Mocked<AuthorizationService>;

    handler = new UseTemplateHandler(
      pageTemplateRepository,
      templateVersionRepository,
      pageTemplateBlockRepository,
      templateDatabaseSnapshotRepository,
      templateEntitlementRepository,
      templateListingRepository,
      pageProvisioningPort,
      databaseProvisioning,
      uow,
      authorizationService,
    );

    // Default setups for blocks and databases
    pageTemplateBlockRepository.findByVersionId.mockResolvedValue([]);
    templateDatabaseSnapshotRepository.findByVersionId.mockResolvedValue([]);

    // Default: destination workspace has PAGE_CREATE
    authorizationService.authorize.mockImplementation(
      async ({ permissions, target }) => {
        if (
          target.type === 'workspace' &&
          target.id === destinationWorkspaceId &&
          permissions.includes(PERMISSIONS.PAGE_CREATE)
        ) {
          return true;
        }
        return false;
      },
    );
  });

  describe('UT-01: PUBLIC + Listing PUBLISHED + User chưa Claim', () => {
    it('throws ForbiddenException when user has no entitlement', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.PUBLISHED),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(
        new ForbiddenException('You must claim this template before using it'),
      );

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });
  });

  describe('UT-02: PUBLIC + Listing PUBLISHED + User đã Claim', () => {
    it('succeeds and clones into destination workspace', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.PUBLISHED),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
      expect(pageProvisioningPort.createPageShell).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: destinationWorkspaceId,
          title: 'Original Template Name',
          createdBy: claimingUserId,
        }),
        mockContext,
      );
    });
  });

  describe('UT-03: PUBLIC + Listing DRAFT + User chưa Claim', () => {
    it('throws ForbiddenException when listing is DRAFT and user has not claimed', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.DRAFT),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(
        new ForbiddenException('You must claim this template before using it'),
      );
    });
  });

  describe('UT-04: PUBLIC + Listing DRAFT + User đã Claim', () => {
    it('succeeds when user previously held an entitlement', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.DRAFT),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
    });
  });

  describe('UT-05: PUBLIC + Không có Listing (Legacy PUBLIC behavior)', () => {
    it('allows using public template without entitlement if no listing exists', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(null);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
      expect(
        templateEntitlementRepository.findByTemplateAndUser,
      ).not.toHaveBeenCalled();
    });
  });

  describe('UT-06: Listing Unpublish + User đã Claim trước đó', () => {
    it('allows user who claimed prior to unpublishing to use template', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      // Listing was unpublished -> status is DRAFT
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.DRAFT),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
    });
  });

  describe('UT-07: PRIVATE + User không có quyền', () => {
    it('throws ForbiddenException when user is not creator and cannot manage source workspace', async () => {
      const privateTemplate = createTemplate({
        visibility: TemplateVisibility.PRIVATE,
      });
      pageTemplateRepository.findById.mockResolvedValue(privateTemplate);

      authorizationService.authorize.mockImplementation(
        async ({ target, permissions }) => {
          // Source workspace update fails
          if (
            target.id === sourceWorkspaceId &&
            permissions.includes(PERMISSIONS.WORKSPACE_UPDATE)
          ) {
            return false;
          }
          return true;
        },
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            'stranger-uuid',
          ),
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to use this private template',
        ),
      );
    });
  });

  describe('UT-08: PRIVATE + Creator', () => {
    it('allows template creator to use private template without checking source workspace update', async () => {
      const privateTemplate = createTemplate({
        visibility: TemplateVisibility.PRIVATE,
        createdBy: creatorId,
      });
      pageTemplateRepository.findById.mockResolvedValue(privateTemplate);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          creatorId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
      // authorizationService should only have been checked for destination PAGE_CREATE
      expect(authorizationService.authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { type: 'workspace', id: destinationWorkspaceId },
          permissions: [PERMISSIONS.PAGE_CREATE],
        }),
      );
    });
  });

  describe('UT-09: WORKSPACE + User không có quyền', () => {
    it('throws ForbiddenException when user lacks WORKSPACE_READ on source workspace', async () => {
      const workspaceTemplate = createTemplate({
        visibility: TemplateVisibility.WORKSPACE,
      });
      pageTemplateRepository.findById.mockResolvedValue(workspaceTemplate);

      authorizationService.authorize.mockImplementation(
        async ({ target, permissions }) => {
          if (
            target.id === sourceWorkspaceId &&
            permissions.includes(PERMISSIONS.WORKSPACE_READ)
          ) {
            return false;
          }
          return true;
        },
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            'outsider-uuid',
          ),
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to use this template',
        ),
      );
    });
  });

  describe('UT-10: PUBLIC + Creator chưa Claim', () => {
    it('exempts creator from claiming even if listing exists', async () => {
      pageTemplateRepository.findById.mockResolvedValue(
        createTemplate({
          visibility: TemplateVisibility.PUBLIC,
          createdBy: creatorId,
        }),
      );
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          creatorId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
      expect(
        templateEntitlementRepository.findByTemplateAndUser,
      ).not.toHaveBeenCalled();
    });
  });

  describe('UT-11: PUBLIC + Workspace Manager chưa Claim', () => {
    it('exempts source workspace manager from claiming', async () => {
      const managerUserId = 'manager-uuid-1';
      pageTemplateRepository.findById.mockResolvedValue(
        createTemplate({
          visibility: TemplateVisibility.PUBLIC,
          createdBy: creatorId,
        }),
      );
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      authorizationService.authorize.mockImplementation(
        async ({ target, permissions }) => {
          if (
            target.id === sourceWorkspaceId &&
            permissions.includes(PERMISSIONS.WORKSPACE_UPDATE)
          ) {
            return true;
          }
          if (
            target.id === destinationWorkspaceId &&
            permissions.includes(PERMISSIONS.PAGE_CREATE)
          ) {
            return true;
          }
          return false;
        },
      );

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          managerUserId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
      expect(
        templateEntitlementRepository.findByTemplateAndUser,
      ).not.toHaveBeenCalled();
    });
  });

  describe('UT-12: User có Entitlement nhưng không có PAGE_CREATE trong Workspace đích', () => {
    it('throws ForbiddenException when destination lacks PAGE_CREATE', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      authorizationService.authorize.mockImplementation(
        async ({ target, permissions }) => {
          if (
            target.id === destinationWorkspaceId &&
            permissions.includes(PERMISSIONS.PAGE_CREATE)
          ) {
            return false;
          }
          return false;
        },
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to create page in destination workspace',
        ),
      );

      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });
  });

  describe('UT-13: User có Entitlement và có PAGE_CREATE trong Workspace đích', () => {
    it('succeeds and creates shell and snapshot blocks in destination workspace', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
      expect(pageProvisioningPort.createPageShell).toHaveBeenCalledWith(
        {
          workspaceId: destinationWorkspaceId,
          title: 'Original Template Name',
          createdBy: claimingUserId,
          icon: 'icon-sparkle',
          coverUrl: 'https://example.com/cover.png',
        },
        mockContext,
      );
      expect(
        pageProvisioningPort.createBlocksFromSnapshot,
      ).toHaveBeenCalledWith(
        {
          pageId: newPageId,
          createdBy: claimingUserId,
          blocks: [],
        },
        mockContext,
      );
    });
  });

  describe('UT-14: Entitlement thuộc User khác', () => {
    it('denies access when user does not own the entitlement', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );

      // Querying for user-c returns null because entitlement belongs only to user-b
      templateEntitlementRepository.findByTemplateAndUser.mockImplementation(
        async (_tId, uId) => {
          if (uId === claimingUserId) {
            return createEntitlement(claimingUserId);
          }
          return null;
        },
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            'user-c-uuid',
          ),
        ),
      ).rejects.toThrow(
        new ForbiddenException('You must claim this template before using it'),
      );
    });
  });

  describe('UT-15: Template ARCHIVED', () => {
    it('throws BadRequestException when template is ARCHIVED', async () => {
      pageTemplateRepository.findById.mockResolvedValue(
        createTemplate({ status: TemplateStatus.ARCHIVED }),
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(
        new BadRequestException('Archived template cannot be used'),
      );
    });
  });

  describe('UT-16: Version DRAFT', () => {
    it('throws Error when template version is in DRAFT status', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      // Version not published -> DRAFT
      templateVersionRepository.findById.mockResolvedValue(
        createVersion({ published: false }),
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow('Only published template versions can be used');
    });
  });

  describe('UT-17: Version thuộc Template khác', () => {
    it('throws BadRequestException when version belongs to another template', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      // Version belongs to foreign-template
      templateVersionRepository.findById.mockResolvedValue(
        createVersion({ templateIdOverride: 'foreign-template-uuid' }),
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Template version does not belong to this template',
        ),
      );
    });
  });

  describe('UT-18: Clone snapshot thất bại -> Rollback', () => {
    it('propagates error and does not finalize provisioning when createBlocksFromSnapshot fails', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      pageProvisioningPort.createBlocksFromSnapshot.mockRejectedValue(
        new Error('Snapshot block cloning failed midway'),
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow('Snapshot block cloning failed midway');

      expect(uow.runInTransaction).toHaveBeenCalled();
    });

    it('propagates error when database provisioning fails', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      databaseProvisioning.provisionDatabases.mockRejectedValue(
        new Error('Database provisioning failed'),
      );

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow('Database provisioning failed');
    });
  });

  describe('UT-19: Clone thành công -> Return đúng pageId', () => {
    it('returns the exact pageId provisioned by pageProvisioningPort', async () => {
      const specificPageId = 'exact-generated-page-uuid';
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());
      pageProvisioningPort.createPageShell.mockResolvedValue({
        pageId: specificPageId,
      });

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(result).toEqual({ pageId: specificPageId });
    });
  });

  describe('UT-20: Use Template -> Không tự tạo Entitlement', () => {
    it('never calls templateEntitlementRepository.create during template usage', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });

    it('never calls templateEntitlementRepository.create even for unlisted public templates', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(null);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('Snapshot Remapping & Edge Cases', () => {
    it('remaps DATABASE_VIEW block dataConfig with provisioned live database and view IDs', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(null);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const tplDbId = 'tpl-db-1';
      const tplViewId = 'tpl-view-1';
      const liveDbId = 'live-db-1';
      const liveViewId = 'live-view-1';

      const mockView = PageTemplateDatabaseView.create({
        id: tplViewId,
        templateDatabaseId: tplDbId,
        name: 'All Tasks',
        type: DatabaseViewType.TABLE,
        position: '0',
      });

      const mockDb = PageTemplateDatabase.create({
        id: tplDbId,
        versionId,
        name: 'Tasks Database',
        views: [mockView],
      });

      templateDatabaseSnapshotRepository.findByVersionId.mockResolvedValue([
        mockDb,
      ]);

      const mockDbViewBlock = PageTemplateBlock.create({
        id: 'block-view-1',
        versionId,
        type: PageBlockType.DATABASE_VIEW,
        createdBy: creatorId,
        dataConfig: {
          database_id: tplDbId,
          view_id: tplViewId,
          layout: 'table',
        },
      });

      pageTemplateBlockRepository.findByVersionId.mockResolvedValue([
        mockDbViewBlock,
      ]);

      databaseProvisioning.provisionDatabases.mockResolvedValue({
        databaseIdMap: new Map([[tplDbId, liveDbId]]),
        propertyIdMap: new Map(),
        optionIdMap: new Map(),
        rowIdMap: new Map(),
        viewIdMap: new Map([[tplViewId, liveViewId]]),
      });

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
      expect(
        pageProvisioningPort.createBlocksFromSnapshot,
      ).toHaveBeenCalledWith(
        {
          pageId: newPageId,
          createdBy: claimingUserId,
          blocks: [
            expect.objectContaining({
              type: PageBlockType.DATABASE_VIEW,
              dataConfig: {
                database_id: liveDbId,
                view_id: liveViewId,
                layout: 'table',
              },
            }),
          ],
        },
        mockContext,
      );
    });

    it('throws BadRequestException if DATABASE_VIEW block references a view that does not belong to the database', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(null);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      const tplDbId = 'tpl-db-1';
      const mockDb = PageTemplateDatabase.create({
        id: tplDbId,
        versionId,
        name: 'Empty Database',
        views: [],
      });
      templateDatabaseSnapshotRepository.findByVersionId.mockResolvedValue([
        mockDb,
      ]);

      const mockDbViewBlock = PageTemplateBlock.create({
        id: 'block-view-1',
        versionId,
        type: PageBlockType.DATABASE_VIEW,
        createdBy: creatorId,
        dataConfig: {
          database_id: tplDbId,
          view_id: 'non-existent-view',
        },
      });
      pageTemplateBlockRepository.findByVersionId.mockResolvedValue([
        mockDbViewBlock,
      ]);

      databaseProvisioning.provisionDatabases.mockResolvedValue({
        databaseIdMap: new Map([[tplDbId, 'live-db-1']]),
        propertyIdMap: new Map(),
        optionIdMap: new Map(),
        rowIdMap: new Map(),
        viewIdMap: new Map(),
      });

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when template does not exist', async () => {
      pageTemplateRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(
          new UseTemplateCommand(
            'missing-template',
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(new NotFoundException('Page template not found'));
    });

    it('throws NotFoundException when version does not exist', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(null);
      templateVersionRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            'missing-version',
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(new NotFoundException('Template version not found'));
    });

    it('allows non-creator with WORKSPACE_UPDATE to use private template', async () => {
      const privateTemplate = createTemplate({
        visibility: TemplateVisibility.PRIVATE,
      });
      pageTemplateRepository.findById.mockResolvedValue(privateTemplate);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      authorizationService.authorize.mockImplementation(
        async ({ target, permissions }) => {
          if (
            target.id === sourceWorkspaceId &&
            permissions.includes(PERMISSIONS.WORKSPACE_UPDATE)
          ) {
            return true;
          }
          if (
            target.id === destinationWorkspaceId &&
            permissions.includes(PERMISSIONS.PAGE_CREATE)
          ) {
            return true;
          }
          return false;
        },
      );

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          'owner-user-uuid',
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
    });

    it('allows member with WORKSPACE_READ to use workspace template', async () => {
      const wsTemplate = createTemplate({
        visibility: TemplateVisibility.WORKSPACE,
      });
      pageTemplateRepository.findById.mockResolvedValue(wsTemplate);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      authorizationService.authorize.mockImplementation(
        async ({ target, permissions }) => {
          if (
            target.id === sourceWorkspaceId &&
            permissions.includes(PERMISSIONS.WORKSPACE_READ)
          ) {
            return true;
          }
          if (
            target.id === destinationWorkspaceId &&
            permissions.includes(PERMISSIONS.PAGE_CREATE)
          ) {
            return true;
          }
          return false;
        },
      );

      const result = await handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          'member-user-uuid',
        ),
      );

      expect(result).toEqual({ pageId: newPageId });
    });
  });
  it('rejects using a version other than the pinned marketplace version for a claimant', async () => {
    pageTemplateRepository.findById.mockResolvedValue(createTemplate());
    const listing = createListing();
    listing.selectPublishedVersion(createVersion());
    templateListingRepository.findByTemplateId.mockResolvedValue(listing);
    templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
      createEntitlement(),
    );
    await expect(
      handler.execute(
        new UseTemplateCommand(
          templateId,
          'different-published-version',
          destinationWorkspaceId,
          claimingUserId,
        ),
      ),
    ).rejects.toThrow('Use the currently distributed marketplace version');
    expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
  });
  it('preserves claimed access to the pinned version after unpublish', async () => {
    pageTemplateRepository.findById.mockResolvedValue(createTemplate());
    const version = createVersion();
    const listing = createListing();
    listing.selectPublishedVersion(version);
    listing.unpublish();
    templateListingRepository.findByTemplateId.mockResolvedValue(listing);
    templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
      createEntitlement(),
    );
    templateVersionRepository.findById.mockResolvedValue(version);
    await expect(
      handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      ),
    ).resolves.toEqual({ pageId: newPageId });
    expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
  });
});
