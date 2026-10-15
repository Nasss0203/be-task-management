import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GetTemplatePreviewHandler } from './get-template-preview.handler';
import { GetTemplatePreviewQuery } from './get-template-preview.query';
import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import { TemplateListing } from '../../../../../marketplace/domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateOfferType } from '../../../../../marketplace/domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../../../marketplace/domain/enums/template-preview-mode.enum';
import { TemplatePrice } from '../../../../../marketplace/domain/value-objects/template-price.vo';

describe('GetTemplatePreviewHandler Security & Access Control', () => {
  let handler: GetTemplatePreviewHandler;
  let pageTemplateRepository: any;
  let templateVersionRepository: any;
  let pageTemplateBlockRepository: any;
  let authorizationService: any;
  let templateDatabaseSnapshotRepository: any;
  let templatePreviewLoader: any;
  let templateListingRepository: any;
  let templateEntitlementRepository: any;

  const templateId = '11111111-1111-1111-1111-111111111111';
  const versionId = '22222222-2222-2222-2222-222222222222';
  const workspaceId = '33333333-3333-3333-3333-333333333333';
  const creatorId = '44444444-4444-4444-4444-444444444444';
  const buyerId = '55555555-5555-5555-5555-555555555555';
  const randomUserId = '66666666-6666-6666-6666-666666666666';

  const createMockTemplate = (visibility = TemplateVisibility.PUBLIC) =>
    PageTemplate.create({
      id: templateId,
      workspaceId,
      name: 'Test Template',
      createdBy: creatorId,
      visibility,
    });

  const createMockVersion = (isPublished = true) => {
    const version = TemplateVersion.create({
      id: versionId,
      templateId,
      versionNumber: 1,
      createdBy: creatorId,
    });
    if (isPublished) {
      version.publish();
    }
    return version;
  };

  const createListing = (
    params: Parameters<typeof TemplateListing.create>[0],
  ) => {
    const listing = TemplateListing.create(params);
    listing.selectPublishedVersion(createMockVersion());
    listing.publish();
    return listing;
  };

  beforeEach(() => {
    pageTemplateRepository = {
      findById: jest.fn().mockResolvedValue(createMockTemplate()),
    };
    templateVersionRepository = {
      findById: jest.fn().mockResolvedValue(createMockVersion(true)),
    };
    pageTemplateBlockRepository = {
      findByVersionId: jest.fn().mockResolvedValue([]),
    };
    authorizationService = {
      authorize: jest.fn().mockResolvedValue(false),
    };
    templateDatabaseSnapshotRepository = {
      findByVersionId: jest.fn().mockResolvedValue([]),
    };
    templatePreviewLoader = {
      loadFrom: jest.fn().mockResolvedValue({
        template: { id: templateId, name: 'Test Template' },
        version: { id: versionId, versionNumber: 1 },
        blocks: [],
        databases: [],
      }),
    };
    templateListingRepository = {
      findByTemplateId: jest.fn().mockResolvedValue(null),
    };
    templateEntitlementRepository = {
      findByTemplateAndUser: jest.fn().mockResolvedValue(null),
    };

    handler = new GetTemplatePreviewHandler(
      pageTemplateRepository,
      templateVersionRepository,
      pageTemplateBlockRepository,
      authorizationService,
      templateDatabaseSnapshotRepository,
      templatePreviewLoader,
      templateListingRepository,
      templateEntitlementRepository,
    );
  });

  describe('PAID Template Security', () => {
    const paidListing = createListing({
      templateId,
      createdBy: creatorId,
      offerType: TemplateOfferType.PAID,
      price: TemplatePrice.create({ amount: 150000, currency: 'VND' }),
      previewMode: TemplatePreviewMode.IMAGE,
    });

    it('limits buyer full preview to the pinned sold version', async () => {
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing);
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue({
        id: 'entitlement',
      });
      const otherId = '77777777-7777-7777-7777-777777777777';
      const other = TemplateVersion.create({
        id: otherId,
        templateId,
        versionNumber: 2,
        createdBy: creatorId,
      });
      other.publish();
      templateVersionRepository.findById.mockResolvedValue(other);
      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, otherId, buyerId),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(templatePreviewLoader.loadFrom).not.toHaveBeenCalled();
    });

    it.each([TemplateVisibility.PRIVATE, TemplateVisibility.PUBLIC])(
      'preserves buyer access to the sold version after visibility becomes %s and listing is unpublished',
      async (visibility) => {
        const listing = createListing({
          templateId,
          createdBy: creatorId,
          offerType: TemplateOfferType.PAID,
          price: TemplatePrice.create({ amount: 150000, currency: 'VND' }),
        });
        listing.unpublish();
        templateListingRepository.findByTemplateId.mockResolvedValue(listing);
        templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue({
          id: 'entitlement',
        });
        pageTemplateRepository.findById.mockResolvedValue(
          createMockTemplate(visibility),
        );
        const result = await handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, buyerId),
        );
        expect(result.isDemo).toBe(false);
        expect(templatePreviewLoader.loadFrom).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
        );
      },
    );

    it('preserves buyer access to the sold version after archive', async () => {
      const template = createMockTemplate();
      template.archive();
      pageTemplateRepository.findById.mockResolvedValue(template);
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing);
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue({
        id: 'entitlement',
      });
      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, buyerId),
      );
      expect(result.isDemo).toBe(false);
    });

    it('blocks an unentitled user after listing unpublish', async () => {
      const listing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 150000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
      });
      listing.unpublish();
      templateListingRepository.findByTemplateId.mockResolvedValue(listing);
      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(templatePreviewLoader.loadFrom).not.toHaveBeenCalled();
    });

    it('blocks unpurchased user from accessing Full Snapshot of PAID template', async () => {
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing);
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You must purchase this template to access its full content',
        ),
      );
      expect(templatePreviewLoader.loadFrom).not.toHaveBeenCalled();
    });

    it('allows creator to access Full Snapshot of their PAID template', async () => {
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing);

      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, creatorId),
      );

      expect(result).toBeDefined();
      expect(templatePreviewLoader.loadFrom).toHaveBeenCalled();
    });

    it('allows workspace owner to access Full Snapshot of PAID template', async () => {
      const ownerId = 'owner-uuid';
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing);
      // Workspace member and owner checks
      authorizationService.authorize.mockImplementation(
        async ({ permissions }: any) => true,
      );

      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, ownerId),
      );

      expect(result).toBeDefined();
      expect(templatePreviewLoader.loadFrom).toHaveBeenCalled();
    });

    it('allows user with valid entitlement to access Full Snapshot of PAID template', async () => {
      templateListingRepository.findByTemplateId.mockResolvedValue(paidListing);
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue({
        id: 'entitlement-uuid',
        templateId,
        userId: buyerId,
      });

      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, buyerId),
      );

      expect(result).toBeDefined();
      expect(templatePreviewLoader.loadFrom).toHaveBeenCalled();
      expect(
        templateEntitlementRepository.findByTemplateAndUser,
      ).toHaveBeenCalledWith(templateId, buyerId);
    });

    it('FAIL CLOSED: blocks unpurchased user from PAID + INTERACTIVE when demo_version_id is null', async () => {
      const paidInteractiveListing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 150000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
        demoVersionId: null,
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(
        paidInteractiveListing,
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You must purchase this template to access its full content',
        ),
      );
      expect(templatePreviewLoader.loadFrom).not.toHaveBeenCalled();
    });

    it('returns ONLY demo version for unpurchased user on PAID + INTERACTIVE listing even if query.versionId points to paid version', async () => {
      const demoVerId = '77777777-7777-7777-7777-777777777777';
      const paidInteractiveListing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 150000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
        demoVersionId: demoVerId,
        demoConfig: { sandbox: true },
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(
        paidInteractiveListing,
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );

      const mockDemoVersion = TemplateVersion.create({
        id: demoVerId,
        templateId,
        versionNumber: 2,
        createdBy: creatorId,
      });
      mockDemoVersion.publish();

      templateVersionRepository.findById.mockImplementation((id: string) => {
        if (id === versionId) return Promise.resolve(createMockVersion(true));
        if (id === demoVerId) return Promise.resolve(mockDemoVersion);
        return Promise.resolve(null);
      });

      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
      );

      expect(result.isDemo).toBe(true);
      expect(result.interactive).toBe(true);
      expect(result.demoConfig).toEqual({ sandbox: true });
      expect(templatePreviewLoader.loadFrom).toHaveBeenCalledWith(
        expect.anything(),
        mockDemoVersion,
      );
    });

    it('FAIL CLOSED: blocks unpurchased user if demo version is not published or matches published version', async () => {
      const demoVerId = '77777777-7777-7777-7777-777777777777';
      const paidInteractiveListing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.PAID,
        price: TemplatePrice.create({ amount: 150000, currency: 'VND' }),
        previewMode: TemplatePreviewMode.INTERACTIVE,
        demoVersionId: demoVerId,
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(
        paidInteractiveListing,
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );

      const draftDemoVersion = TemplateVersion.create({
        id: demoVerId,
        templateId,
        versionNumber: 2,
        createdBy: creatorId,
      }); // isDraft = true

      templateVersionRepository.findById.mockImplementation((id: string) => {
        if (id === versionId) return Promise.resolve(createMockVersion(true));
        if (id === demoVerId) return Promise.resolve(draftDemoVersion);
        return Promise.resolve(null);
      });

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Preview Mode Restrictions', () => {
    it('blocks user without entitlement when previewMode is IMAGE on FREE listing', async () => {
      const freeImageListing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.FREE,
        previewMode: TemplatePreviewMode.IMAGE,
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(
        freeImageListing,
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Interactive preview is disabled for this template listing',
        ),
      );
      expect(templatePreviewLoader.loadFrom).not.toHaveBeenCalled();
    });

    it('allows claimed user to view template even if previewMode is IMAGE', async () => {
      const freeImageListing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.FREE,
        previewMode: TemplatePreviewMode.IMAGE,
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(
        freeImageListing,
      );
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue({
        id: 'entitlement-uuid',
        templateId,
        userId: buyerId,
      });

      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, buyerId),
      );

      expect(result).toBeDefined();
      expect(templatePreviewLoader.loadFrom).toHaveBeenCalled();
    });

    it('allows interactive preview for FREE template with INTERACTIVE previewMode', async () => {
      const freeInteractiveListing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.FREE,
        previewMode: TemplatePreviewMode.INTERACTIVE,
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(
        freeInteractiveListing,
      );

      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
      );

      expect(result).toBeDefined();
      expect(templatePreviewLoader.loadFrom).toHaveBeenCalled();
    });
  });

  describe('Template Visibility & Draft Protection', () => {
    it('allows a workspace member to preview an internal FREE published version', async () => {
      pageTemplateRepository.findById.mockResolvedValue(
        createMockTemplate(TemplateVisibility.WORKSPACE),
      );
      authorizationService.authorize.mockImplementation(
        async ({ permissions }: { permissions: string[] }) =>
          permissions.includes('workspace.read'),
      );
      const result = await handler.execute(
        new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
      );
      expect(result.isDemo).toBe(false);
      expect(templatePreviewLoader.loadFrom).toHaveBeenCalled();
    });

    it('blocks non-creator and non-owner for PRIVATE template', async () => {
      pageTemplateRepository.findById.mockResolvedValue(
        createMockTemplate(TemplateVisibility.PRIVATE),
      );

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks non-member for WORKSPACE template', async () => {
      pageTemplateRepository.findById.mockResolvedValue(
        createMockTemplate(TemplateVisibility.WORKSPACE),
      );
      authorizationService.authorize.mockResolvedValue(false);

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('blocks unauthorized users from previewing DRAFT version', async () => {
      const listing = createListing({
        templateId,
        createdBy: creatorId,
        offerType: TemplateOfferType.FREE,
        previewMode: TemplatePreviewMode.INTERACTIVE,
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(listing);
      templateVersionRepository.findById.mockResolvedValue(
        createMockVersion(false), // Draft!
      );

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to preview draft template versions',
        ),
      );
    });

    it('throws NotFoundException when template does not exist', async () => {
      pageTemplateRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, randomUserId),
        ),
      ).rejects.toThrow(new NotFoundException('Page template not found'));
    });

    it('throws NotFoundException when version does not exist', async () => {
      templateVersionRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, creatorId),
        ),
      ).rejects.toThrow(new NotFoundException('Template version not found'));
    });

    it('throws BadRequestException when version belongs to different template', async () => {
      const otherTemplateVersion = TemplateVersion.create({
        id: versionId,
        templateId: 'different-template-id',
        versionNumber: 1,
        createdBy: creatorId,
      });
      templateVersionRepository.findById.mockResolvedValue(
        otherTemplateVersion,
      );

      await expect(
        handler.execute(
          new GetTemplatePreviewQuery(templateId, versionId, creatorId),
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Template version does not belong to this template',
        ),
      );
    });
  });
});
