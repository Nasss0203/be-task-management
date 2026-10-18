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
import { TemplateEntitlement } from '../../../../../marketplace/domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplateListing } from '../../../../../marketplace/domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateMarketplaceRelease } from '../../../../../marketplace/domain/aggregates/template-marketplace-release/template-marketplace-release.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateBlock } from '../../../../domain/entities/page-template-block.entity';
import { TemplateEntitlementSource } from '../../../../../marketplace/domain/enums/template-entitlement-source.enum';
import { TemplateListingStatus } from '../../../../../marketplace/domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../../marketplace/domain/enums/template-offer-type.enum';
import { TemplatePrice } from '../../../../../marketplace/domain/value-objects/template-price.vo';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateEntitlementRepository } from '../../../../../marketplace/domain/repositories/template-entitlement.repository';
import type { TemplateListingRepository } from '../../../../../marketplace/domain/repositories/template-listing.repository';
import type { TemplateMarketplaceReleaseRepository } from '../../../../../marketplace/domain/repositories/template-marketplace-release.repository';
import type { TemplateAnalyticsEventRepository } from '../../../../../marketplace/domain/repositories/template-analytics-event.repository';
import { TemplateAnalyticsEventType } from '../../../../../marketplace/domain/enums/template-analytics-event-type.enum';
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
  let releaseRepository: jest.Mocked<TemplateMarketplaceReleaseRepository>;
  let pageProvisioningPort: jest.Mocked<ContentPageProvisioningPort>;
  let databaseProvisioning: jest.Mocked<DatabaseProvisioningPort>;
  let uow: jest.Mocked<UnitOfWork>;
  let authorizationService: jest.Mocked<AuthorizationService>;
  let analyticsEvents: jest.Mocked<TemplateAnalyticsEventRepository>;

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
      publishedVersionId: versionId,
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

  let freeClaims: { claim: jest.Mock };

  beforeEach(() => {
    freeClaims = {
      claim: jest
        .fn()
        .mockImplementation(async (_templateId: string, userId: string) =>
          createEntitlement(userId),
        ),
    };

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

    releaseRepository = {
      findByTemplateAndVersion: jest
        .fn()
        .mockImplementation(async (_templateId, requestedVersionId) =>
          TemplateMarketplaceRelease.create({
            templateId,
            versionId: requestedVersionId,
            releasedBy: null,
            offerTypeAtRelease: TemplateOfferType.FREE,
          }),
        ),
    } as unknown as jest.Mocked<TemplateMarketplaceReleaseRepository>;

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

    analyticsEvents = {
      insertIfAbsent: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
    } as unknown as jest.Mocked<TemplateAnalyticsEventRepository>;

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
      releaseRepository,
      freeClaims,
      analyticsEvents,
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
    it('claims the FREE template in the same transaction and clones it', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.PUBLISHED),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
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
      expect(freeClaims.claim).toHaveBeenCalledWith(
        templateId,
        claimingUserId,
        mockContext,
      );
      expect(uow.runInTransaction).toHaveBeenCalledTimes(1);
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
        new ForbiddenException('This template is not available on the marketplace'),
      );
      expect(freeClaims.claim).not.toHaveBeenCalled();
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

  describe('UT-05: PUBLIC without listing', () => {
    it('denies use without entitlement or a listing', async () => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(null);
      templateVersionRepository.findById.mockResolvedValue(createVersion());

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(ForbiddenException);
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

  describe('buyer rights after visibility and archive changes', () => {
    it.each([TemplateVisibility.PRIVATE, TemplateVisibility.WORKSPACE])(
      'keeps use access to the pinned version when visibility is %s',
      async (visibility) => {
        pageTemplateRepository.findById.mockResolvedValue(
          createTemplate({ visibility }),
        );
        templateListingRepository.findByTemplateId.mockResolvedValue(
          createListing(),
        );
        templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
          createEntitlement(),
        );
        templateVersionRepository.findById.mockResolvedValue(createVersion());
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
      },
    );

    it('keeps use access to the pinned version after archive', async () => {
      pageTemplateRepository.findById.mockResolvedValue(
        createTemplate({ status: TemplateStatus.ARCHIVED }),
      );
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.DRAFT),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());
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
    it("never reuses another user's entitlement; claims for the caller instead", async () => {
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
      ).rejects.toThrow(NotFoundException);
      // user-c gets their own claim; user-b's entitlement is never used.
      expect(freeClaims.claim).toHaveBeenCalledWith(
        templateId,
        'user-c-uuid',
        mockContext,
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

  describe('USE analytics event', () => {
    beforeEach(() => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());
    });

    const execute = () =>
      handler.execute(
        new UseTemplateCommand(
          templateId,
          versionId,
          destinationWorkspaceId,
          claimingUserId,
        ),
      );

    it('records one USE keyed by the new page in the clone transaction', async () => {
      await execute();

      expect(analyticsEvents.insertIfAbsent).toHaveBeenCalledTimes(1);
      const [event, context] = analyticsEvents.insertIfAbsent.mock.calls[0];
      expect(context).toBe(mockContext);
      expect(event.getEventType()).toBe(TemplateAnalyticsEventType.USE);
      expect(event.getTemplateId()).toBe(templateId);
      expect(event.getVersionId()).toBe(versionId);
      expect(event.getUserId()).toBe(claimingUserId);
      expect(event.getSourceId()).toBe(newPageId);
    });

    it('still returns the page when the USE was already recorded', async () => {
      analyticsEvents.insertIfAbsent.mockResolvedValue(false);

      await expect(execute()).resolves.toEqual({ pageId: newPageId });
    });

    it('records nothing when the clone fails', async () => {
      pageProvisioningPort.createBlocksFromSnapshot.mockRejectedValue(
        new Error('clone failed'),
      );

      await expect(execute()).rejects.toThrow('clone failed');
      expect(analyticsEvents.insertIfAbsent).not.toHaveBeenCalled();
    });

    it('fails the use when the analytics write fails, so the transaction rolls back', async () => {
      analyticsEvents.insertIfAbsent.mockRejectedValue(new Error('db down'));

      await expect(execute()).rejects.toThrow('db down');
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

      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            versionId,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(ForbiddenException);

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

      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(),
      );
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
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(),
      );
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
            creatorId,
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
  it('rejects an unrecorded version for a claimant', async () => {
    pageTemplateRepository.findById.mockResolvedValue(createTemplate());
    const listing = createListing();
    listing.selectPublishedVersion(createVersion());
    templateListingRepository.findByTemplateId.mockResolvedValue(listing);
    templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
      createEntitlement(),
    );
    const otherVersion = TemplateVersion.create({
      id: 'different-published-version',
      templateId,
      versionNumber: 2,
      createdBy: creatorId,
    });
    otherVersion.publish();
    templateVersionRepository.findById.mockResolvedValue(otherVersion);
    releaseRepository.findByTemplateAndVersion.mockResolvedValue(null);
    await expect(
      handler.execute(
        new UseTemplateCommand(
          templateId,
          'different-published-version',
          destinationWorkspaceId,
          claimingUserId,
        ),
      ),
    ).rejects.toThrow(
      'Template version is not an official marketplace release',
    );
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

  describe('Official Marketplace Releases', () => {
    const v1 = 'paid-version-v1';
    const v2 = 'demo-version-v2';
    const v3 = 'paid-version-v3';

    const paidEntitlement = () =>
      TemplateEntitlement.restore({
        id: 'paid-entitlement',
        templateId,
        userId: claimingUserId,
        source: TemplateEntitlementSource.PAID_PURCHASE,
        createdAt: new Date('2026-01-02T00:00:00Z'),
      });
    const paidListing = () =>
      TemplateListing.restore({
        id: 'paid-listing',
        templateId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 50000, currency: 'VND' }),
        status: TemplateListingStatus.PUBLISHED,
        publishedVersionId: v3,
        demoVersionId: v2,
        createdBy: creatorId,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    const publishedVersion = (id: string) => {
      const item = TemplateVersion.create({
        id,
        templateId,
        versionNumber: id === v1 ? 1 : id === v2 ? 2 : 3,
        createdBy: creatorId,
      });
      item.publish();
      return item;
    };
    const officialRelease = (
      id: string,
      offerTypeAtRelease = TemplateOfferType.PAID,
    ) =>
      TemplateMarketplaceRelease.create({
        templateId,
        versionId: id,
        releasedBy: creatorId,
        offerTypeAtRelease,
      });

    beforeEach(() => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        paidListing(),
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        paidEntitlement(),
      );
      templateVersionRepository.findById.mockImplementation(async (id) =>
        publishedVersion(id),
      );
      releaseRepository.findByTemplateAndVersion.mockImplementation(
        async (_id, id) => (id === v2 ? null : officialRelease(id)),
      );
    });

    it.each([v1, v3])(
      'lets a paid buyer use official release %s',
      async (id) => {
        await expect(
          handler.execute(
            new UseTemplateCommand(
              templateId,
              id,
              destinationWorkspaceId,
              claimingUserId,
            ),
          ),
        ).resolves.toEqual({ pageId: newPageId });
        expect(releaseRepository.findByTemplateAndVersion).toHaveBeenCalledWith(
          templateId,
          id,
          mockContext,
        );
        expect(pageProvisioningPort.createPageShell).toHaveBeenCalled();
      },
    );

    it('keeps V1 access after the listing changes to V3 and is unpublished, private, or archived', async () => {
      const listing = paidListing();
      listing.unpublish();
      templateListingRepository.findByTemplateId.mockResolvedValue(listing);
      for (const template of [
        createTemplate(),
        createTemplate({ visibility: TemplateVisibility.PRIVATE }),
        createTemplate({ status: TemplateStatus.ARCHIVED }),
      ]) {
        pageTemplateRepository.findById.mockResolvedValue(template);
        await expect(
          handler.execute(
            new UseTemplateCommand(
              templateId,
              v1,
              destinationWorkspaceId,
              claimingUserId,
            ),
          ),
        ).resolves.toEqual({ pageId: newPageId });
      }
    });

    it('lets a PAID_PURCHASE buyer use an official release that is also the demo', async () => {
      releaseRepository.findByTemplateAndVersion.mockResolvedValue(
        officialRelease(v2),
      );
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v2,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).resolves.toEqual({ pageId: newPageId });
    });

    it('still rejects a demo version that was never officially released', async () => {
      releaseRepository.findByTemplateAndVersion.mockResolvedValue(null);
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v2,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(
        'Template version is not an official marketplace release',
      );
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('does not let a FREE_CLAIM use a paid release, even when it is the demo', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        TemplateEntitlement.restore({
          id: 'free-entitlement',
          templateId,
          userId: claimingUserId,
          source: TemplateEntitlementSource.FREE_CLAIM,
          createdAt: new Date('2026-01-02T00:00:00Z'),
        }),
      );
      releaseRepository.findByTemplateAndVersion.mockResolvedValue(
        officialRelease(v2, TemplateOfferType.PAID),
      );
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v2,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow('Free claim does not grant access to paid releases');
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('rejects a Draft version before reading release history', async () => {
      templateVersionRepository.findById.mockResolvedValue(
        TemplateVersion.create({
          id: v1,
          templateId,
          versionNumber: 1,
          createdBy: creatorId,
        }),
      );
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v1,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow('Only published template versions can be used');
      expect(releaseRepository.findByTemplateAndVersion).not.toHaveBeenCalled();
    });

    it('denies a paid release without an entitlement', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v1,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('keeps FREE_CLAIM out of a PAID release', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(),
      );
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v1,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow('Free claim does not grant access to paid releases');
    });

    it('lets FREE_CLAIM use an older FREE release after a listing becomes PAID', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(),
      );
      releaseRepository.findByTemplateAndVersion.mockResolvedValue(
        officialRelease(v1, TemplateOfferType.FREE),
      );
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v1,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).resolves.toEqual({ pageId: newPageId });
    });

    it('still requires PAGE_CREATE in the destination workspace', async () => {
      authorizationService.authorize.mockResolvedValue(false);
      await expect(
        handler.execute(
          new UseTemplateCommand(
            templateId,
            v1,
            destinationWorkspaceId,
            claimingUserId,
          ),
        ),
      ).rejects.toThrow(
        'You do not have permission to create page in destination workspace',
      );
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });
  });

  describe('Implicit FREE claim on Use', () => {
    const useAs = (userId = claimingUserId, version = versionId) =>
      handler.execute(
        new UseTemplateCommand(templateId, version, destinationWorkspaceId, userId),
      );
    const freeRelease = (offerTypeAtRelease: TemplateOfferType) =>
      releaseRepository.findByTemplateAndVersion.mockImplementation(
        async (_templateId, requestedVersionId) =>
          TemplateMarketplaceRelease.create({
            templateId,
            versionId: requestedVersionId,
            releasedBy: null,
            offerTypeAtRelease,
          }),
      );
    const paidListing = () =>
      TemplateListing.restore({
        id: 'listing-uuid-1',
        templateId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 99000, currency: 'VND' }),
        status: TemplateListingStatus.PUBLISHED,
        publishedVersionId: versionId,
        createdBy: creatorId,
        publishedAt: new Date(),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

    beforeEach(() => {
      pageTemplateRepository.findById.mockResolvedValue(createTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createListing(TemplateListingStatus.PUBLISHED),
      );
      templateVersionRepository.findById.mockResolvedValue(createVersion());
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(null);
    });

    it('does not claim again when a FREE_CLAIM already exists', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        createEntitlement(claimingUserId),
      );
      await expect(useAs()).resolves.toEqual({ pageId: newPageId });
      expect(freeClaims.claim).not.toHaveBeenCalled();
    });

    it('keeps a PAID_PURCHASE untouched and lets the buyer use a paid release', async () => {
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing());
      freeRelease(TemplateOfferType.PAID);
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        TemplateEntitlement.restore({
          id: 'paid-entitlement',
          templateId,
          userId: claimingUserId,
          source: TemplateEntitlementSource.PAID_PURCHASE,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
        }),
      );
      await expect(useAs()).resolves.toEqual({ pageId: newPageId });
      expect(freeClaims.claim).not.toHaveBeenCalled();
    });

    it('rejects a PAID template the user has not bought, without claiming', async () => {
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing());
      await expect(useAs()).rejects.toThrow(
        new ForbiddenException('You must purchase this template before using it'),
      );
      expect(freeClaims.claim).not.toHaveBeenCalled();
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('does not let a FREE_CLAIM use a paid release (no free copy of paid content)', async () => {
      // Listing is FREE now, but the requested version was released as PAID.
      freeRelease(TemplateOfferType.PAID);
      await expect(useAs()).rejects.toThrow(
        new ForbiddenException('Free claim does not grant access to paid releases'),
      );
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('does not require any permission on the source workspace', async () => {
      // Default authorize mock grants only PAGE_CREATE on the destination.
      await expect(useAs()).resolves.toEqual({ pageId: newPageId });
      expect(authorizationService.authorize).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: [PERMISSIONS.WORKSPACE_UPDATE],
          target: { type: 'workspace', id: sourceWorkspaceId },
        }),
      );
    });

    it('requires PAGE_CREATE on the destination workspace', async () => {
      authorizationService.authorize.mockResolvedValue(false);
      await expect(useAs()).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to create page in destination workspace',
        ),
      );
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('rejects versions that are not official releases or are drafts', async () => {
      releaseRepository.findByTemplateAndVersion.mockResolvedValue(null);
      await expect(useAs()).rejects.toThrow(
        new BadRequestException(
          'Template version is not an official marketplace release',
        ),
      );

      // A draft is rejected even when it has a (FREE) release record.
      freeRelease(TemplateOfferType.FREE);
      templateVersionRepository.findById.mockResolvedValue(
        createVersion({ published: false }),
      );
      await expect(useAs()).rejects.toThrow(BadRequestException);
      expect(releaseRepository.findByTemplateAndVersion).toHaveBeenCalledTimes(1);
      expect(pageProvisioningPort.createPageShell).not.toHaveBeenCalled();
    });

    it('rolls the new claim back when cloning fails', async () => {
      const committed: string[] = [];
      const rolledBack: string[] = [];
      uow.runInTransaction.mockImplementation(async (fn) => {
        try {
          const result = await fn(mockContext);
          committed.push('tx');
          return result;
        } catch (error) {
          rolledBack.push('tx');
          throw error;
        }
      });
      pageProvisioningPort.createBlocksFromSnapshot.mockRejectedValue(
        new Error('clone failed'),
      );

      await expect(useAs()).rejects.toThrow('clone failed');
      // The claim ran inside the transaction that rolled back.
      expect(freeClaims.claim).toHaveBeenCalledWith(
        templateId,
        claimingUserId,
        mockContext,
      );
      expect(rolledBack).toEqual(['tx']);
      expect(committed).toEqual([]);
    });

    it('retries once with the existing claim when a concurrent Use created it first', async () => {
      freeClaims.claim.mockRejectedValueOnce({
        driverError: {
          code: '23505',
          constraint: 'UQ_template_entitlements_template_user',
        },
      });
      // The second attempt sees the claim the other request committed.
      templateEntitlementRepository.findByTemplateAndUser
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createEntitlement(claimingUserId));

      await expect(useAs()).resolves.toEqual({ pageId: newPageId });
      expect(uow.runInTransaction).toHaveBeenCalledTimes(2);
      expect(freeClaims.claim).toHaveBeenCalledTimes(1);
      expect(pageProvisioningPort.createPageShell).toHaveBeenCalledTimes(1);
    });

    it('never claims for the creator or a source workspace manager', async () => {
      await expect(useAs(creatorId)).resolves.toEqual({ pageId: newPageId });
      expect(freeClaims.claim).not.toHaveBeenCalled();
    });
  });
});
