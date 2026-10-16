/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateEntitlement } from '../../../../../marketplace/domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplateListing } from '../../../../../marketplace/domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { TemplateEntitlementSource } from '../../../../../marketplace/domain/enums/template-entitlement-source.enum';
import { TemplateListingStatus } from '../../../../../marketplace/domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../../../marketplace/domain/enums/template-offer-type.enum';
import { TemplatePrice } from '../../../../../marketplace/domain/value-objects/template-price.vo';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateEntitlementRepository } from '../../../../../marketplace/domain/repositories/template-entitlement.repository';
import type { TemplateListingRepository } from '../../../../../marketplace/domain/repositories/template-listing.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TemplateEntitlementResponseDto } from '../../../../../marketplace/application/dto/template-entitlement/template-entitlement.response.dto';
import { ClaimFreeTemplateCommand } from '../../../../../marketplace/application/commands/template-entitlement/claim-free-template/claim-free-template.command';
import { ClaimFreeTemplateHandler } from '../../../../../marketplace/application/commands/template-entitlement/claim-free-template/claim-free-template.handler';

describe('ClaimFreeTemplateHandler Regression Tests', () => {
  let pageTemplateRepository: jest.Mocked<PageTemplateRepository>;
  let templateListingRepository: jest.Mocked<TemplateListingRepository>;
  let templateVersionRepository: jest.Mocked<TemplateVersionRepository>;
  let templateEntitlementRepository: jest.Mocked<TemplateEntitlementRepository>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let handler: ClaimFreeTemplateHandler;

  const mockContext = {
    id: 'test-persistence-context',
  } as PersistenceContext;

  const templateId = 'template-uuid-1';
  const userId = 'user-uuid-1';
  const creatorId = 'creator-uuid-1';

  const createPublicTemplate = (status = TemplateStatus.PUBLISHED) =>
    PageTemplate.restore({
      id: templateId,
      sourcePageId: 'source-page-1',
      workspaceId: 'workspace-1',
      name: 'Free Public Template',
      description: 'A template for testing',
      icon: null,
      coverUrl: null,
      createdBy: creatorId,
      status,
      visibility: TemplateVisibility.PUBLIC,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

  const createPublishedListing = (offerType = TemplateOfferType.FREE) =>
    TemplateListing.restore({
      id: 'listing-uuid-1',
      templateId,
      offerType,
      price:
        offerType === TemplateOfferType.PAID
          ? TemplatePrice.create({ amount: 10000, currency: 'VND' })
          : TemplatePrice.free(),
      status: TemplateListingStatus.PUBLISHED,
      createdBy: creatorId,
      publishedAt: new Date('2026-01-02T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

  const createPublishedVersion = () => {
    const version = TemplateVersion.create({
      id: 'version-uuid-1',
      templateId,
      versionNumber: 1,
      createdBy: creatorId,
    });
    version.publish();
    return version;
  };

  const createExistingEntitlement = () =>
    TemplateEntitlement.restore({
      id: 'entitlement-uuid-1',
      templateId,
      userId,
      source: TemplateEntitlementSource.FREE_CLAIM,
      createdAt: new Date('2026-01-05T00:00:00.000Z'),
    });

  beforeEach(() => {
    const findMock = jest.fn();
    pageTemplateRepository = {
      findById: findMock,
      findByIdForUpdate: findMock,
    } as unknown as jest.Mocked<PageTemplateRepository>;

    templateListingRepository = {
      findByTemplateId: jest.fn(),
    } as unknown as jest.Mocked<TemplateListingRepository>;

    templateVersionRepository = {
      findPublishedByTemplateId: jest.fn(),
    } as unknown as jest.Mocked<TemplateVersionRepository>;

    templateEntitlementRepository = {
      findByTemplateAndUser: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<TemplateEntitlementRepository>;

    unitOfWork = {
      runInTransaction: jest
        .fn()
        .mockImplementation((fn: (ctx: PersistenceContext) => unknown) =>
          fn(mockContext),
        ),
    };

    handler = new ClaimFreeTemplateHandler(
      pageTemplateRepository,
      templateListingRepository,
      templateVersionRepository,
      templateEntitlementRepository,
      unitOfWork,
    );
  });

  describe('CL-01: Claim FREE lần đầu', () => {
    it('creates an entitlement and returns entitlement DTO with source FREE_CLAIM', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createPublishedListing(),
      );
      templateVersionRepository.findPublishedByTemplateId.mockResolvedValue(
        createPublishedVersion(),
      );

      const savedEntitlement = TemplateEntitlement.restore({
        id: 'new-entitlement-uuid',
        templateId,
        userId,
        source: TemplateEntitlementSource.FREE_CLAIM,
        createdAt: new Date('2026-01-10T00:00:00.000Z'),
      });
      templateEntitlementRepository.create.mockResolvedValue(savedEntitlement);

      const result = await handler.execute(
        new ClaimFreeTemplateCommand(templateId, userId),
      );

      expect(unitOfWork.runInTransaction).toHaveBeenCalled();
      expect(
        templateEntitlementRepository.findByTemplateAndUser,
      ).toHaveBeenCalledWith(templateId, userId, mockContext);
      expect(pageTemplateRepository.findById).toHaveBeenCalledWith(
        templateId,
        mockContext,
      );
      expect(templateListingRepository.findByTemplateId).toHaveBeenCalledWith(
        templateId,
        mockContext,
      );
      expect(
        templateVersionRepository.findPublishedByTemplateId,
      ).toHaveBeenCalledWith(templateId, mockContext);
      expect(templateEntitlementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          getTemplateId: expect.any(Function),
          getUserId: expect.any(Function),
          getSource: expect.any(Function),
        }),
        mockContext,
      );
      expect(result).toBeInstanceOf(TemplateEntitlementResponseDto);
      expect(result.template_id).toBe(templateId);
      expect(result.user_id).toBe(userId);
      expect(result.source).toBe(TemplateEntitlementSource.FREE_CLAIM);
    });
  });

  describe('CL-02: Claim FREE lần thứ hai (Idempotent)', () => {
    it('returns the existing entitlement DTO without creating a duplicate', async () => {
      const existing = createExistingEntitlement();
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        existing,
      );

      const result = await handler.execute(
        new ClaimFreeTemplateCommand(templateId, userId),
      );

      expect(result).toBeInstanceOf(TemplateEntitlementResponseDto);
      expect(result.id).toBe(existing.getId());
      expect(result.template_id).toBe(templateId);
      expect(result.user_id).toBe(userId);
      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
      expect(pageTemplateRepository.findById).not.toHaveBeenCalled();
      expect(templateListingRepository.findByTemplateId).not.toHaveBeenCalled();
      expect(
        templateVersionRepository.findPublishedByTemplateId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('CL-03: Claim Template PRIVATE', () => {
    it('rejects with NotFoundException when template is PRIVATE', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      const privateTemplate = PageTemplate.restore({
        id: templateId,
        sourcePageId: null,
        workspaceId: 'workspace-1',
        name: 'Private Template',
        description: null,
        icon: null,
        coverUrl: null,
        createdBy: creatorId,
        status: TemplateStatus.PUBLISHED,
        visibility: TemplateVisibility.PRIVATE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      pageTemplateRepository.findById.mockResolvedValue(privateTemplate);

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(new NotFoundException('Template not found'));

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('CL-04: Claim Template ARCHIVED', () => {
    it('rejects with NotFoundException when template is ARCHIVED', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      const archivedTemplate = createPublicTemplate(TemplateStatus.ARCHIVED);
      pageTemplateRepository.findById.mockResolvedValue(archivedTemplate);

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(new NotFoundException('Template not found'));

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('CL-05: Claim Listing chưa Publish', () => {
    it('rejects with NotFoundException when listing is in DRAFT status', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      const draftListing = TemplateListing.restore({
        id: 'listing-uuid-1',
        templateId,
        offerType: TemplateOfferType.FREE,
        status: TemplateListingStatus.DRAFT,
        createdBy: creatorId,
        publishedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      templateListingRepository.findByTemplateId.mockResolvedValue(
        draftListing,
      );

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(new NotFoundException('Template not found'));

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });

    it('rejects with NotFoundException when listing does not exist', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(null);

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(new NotFoundException('Template not found'));

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('CL-06: Claim khi không có Published Version', () => {
    it('rejects with NotFoundException when template has no published version', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createPublishedListing(),
      );
      templateVersionRepository.findPublishedByTemplateId.mockResolvedValue(
        null,
      );

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(new NotFoundException('Template not found'));

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('CL-07: Hai request Claim đồng thời (Race condition / Unique constraint)', () => {
    it('handles unique constraint violation (23505) and returns existing entitlement outside transaction', async () => {
      const existing = createExistingEntitlement();

      // Inside transaction: findByTemplateAndUser returns null (initial check before race)
      // When create is called, it simulates Postgres 23505 unique violation
      templateEntitlementRepository.findByTemplateAndUser.mockImplementation(
        async (_tId, _uId, ctx) => {
          if (ctx) {
            return null;
          }
          // Outside transaction (after rollback): findByTemplateAndUser returns the concurrent winner's entitlement
          return existing;
        },
      );

      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createPublishedListing(),
      );
      templateVersionRepository.findPublishedByTemplateId.mockResolvedValue(
        createPublishedVersion(),
      );

      templateEntitlementRepository.create.mockRejectedValue({
        code: '23505',
        constraint: 'UQ_template_entitlements_template_user',
      });

      const result = await handler.execute(
        new ClaimFreeTemplateCommand(templateId, userId),
      );

      expect(result).toBeInstanceOf(TemplateEntitlementResponseDto);
      expect(result.id).toBe(existing.getId());
      expect(result.template_id).toBe(templateId);
      expect(result.user_id).toBe(userId);
      // Confirmed that outside query did not pass the rolled-back context
      expect(
        templateEntitlementRepository.findByTemplateAndUser,
      ).toHaveBeenCalledWith(templateId, userId);
    });

    it('handles unique constraint wrapped in driverError', async () => {
      const existing = createExistingEntitlement();

      templateEntitlementRepository.findByTemplateAndUser.mockImplementation(
        async (_tId, _uId, ctx) => {
          if (ctx) return null;
          return existing;
        },
      );

      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createPublishedListing(),
      );
      templateVersionRepository.findPublishedByTemplateId.mockResolvedValue(
        createPublishedVersion(),
      );

      templateEntitlementRepository.create.mockRejectedValue({
        driverError: {
          code: '23505',
          constraint: 'UQ_template_entitlements_template_user',
        },
      });

      const result = await handler.execute(
        new ClaimFreeTemplateCommand(templateId, userId),
      );

      expect(result.id).toBe(existing.getId());
    });

    it('re-throws non-23505 database errors', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createPublishedListing(),
      );
      templateVersionRepository.findPublishedByTemplateId.mockResolvedValue(
        createPublishedVersion(),
      );

      const dbError = new Error('Database connection failed');
      templateEntitlementRepository.create.mockRejectedValue(dbError);

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('CL-08: Claim lại sau khi Listing Unpublish', () => {
    it('returns existing entitlement even if the listing was subsequently unpublished', async () => {
      const existing = createExistingEntitlement();
      // User claimed before when listing was published; now listing is draft/unpublished.
      // Because check for existing entitlement occurs before listing status validation,
      // the existing entitlement is returned without error.
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        existing,
      );

      const result = await handler.execute(
        new ClaimFreeTemplateCommand(templateId, userId),
      );

      expect(result).toBeInstanceOf(TemplateEntitlementResponseDto);
      expect(result.id).toBe(existing.getId());
      expect(result.template_id).toBe(templateId);
      expect(result.user_id).toBe(userId);
      expect(templateListingRepository.findByTemplateId).not.toHaveBeenCalled();
    });
  });

  describe('Additional Business Rules & Edge Cases', () => {
    it('rejects with BadRequestException when listing offerType is not FREE (e.g. PAID)', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
      // Listing is published but non-free (future offer type)
      templateListingRepository.findByTemplateId.mockResolvedValue(
        createPublishedListing('PAID' as unknown as TemplateOfferType),
      );

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(
        new BadRequestException('Template listing is not free'),
      );

      expect(templateEntitlementRepository.create).not.toHaveBeenCalled();
    });

    it('rejects with NotFoundException when template does not exist', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      pageTemplateRepository.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(new NotFoundException('Template not found'));

      expect(templateListingRepository.findByTemplateId).not.toHaveBeenCalled();
    });

    it('rejects with NotFoundException when template visibility is WORKSPACE', async () => {
      templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(
        null,
      );
      const workspaceTemplate = PageTemplate.restore({
        id: templateId,
        sourcePageId: null,
        workspaceId: 'workspace-1',
        name: 'Workspace Template',
        description: null,
        icon: null,
        coverUrl: null,
        createdBy: creatorId,
        status: TemplateStatus.PUBLISHED,
        visibility: TemplateVisibility.WORKSPACE,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      pageTemplateRepository.findById.mockResolvedValue(workspaceTemplate);

      await expect(
        handler.execute(new ClaimFreeTemplateCommand(templateId, userId)),
      ).rejects.toThrow(new NotFoundException('Template not found'));
    });
  });
  it('claims using the pinned version rather than the highest published version', async () => {
    templateEntitlementRepository.findByTemplateAndUser.mockResolvedValue(null);
    pageTemplateRepository.findById.mockResolvedValue(createPublicTemplate());
    const listing = createPublishedListing();
    const version = createPublishedVersion();
    listing.selectPublishedVersion(version);
    templateListingRepository.findByTemplateId.mockResolvedValue(listing);
    templateVersionRepository.findById = jest.fn().mockResolvedValue(version);
    templateEntitlementRepository.create.mockResolvedValue(
      createExistingEntitlement(),
    );
    await handler.execute(new ClaimFreeTemplateCommand(templateId, userId));
    expect(templateVersionRepository.findById).toHaveBeenCalledWith(
      version.getId(),
      mockContext,
    );
    expect(
      templateVersionRepository.findPublishedByTemplateId,
    ).not.toHaveBeenCalled();
  });
});
