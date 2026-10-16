import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetPublicTemplatePreviewHandler } from './get-public-template-preview.handler';
import { GetPublicTemplatePreviewQuery } from './get-public-template-preview.query';
import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../../domain/enums/template-preview-mode.enum';
import { TemplatePrice } from '../../../../domain/value-objects/template-price.vo';

describe('GetPublicTemplatePreviewHandler Security & Policy', () => {
  let handler: GetPublicTemplatePreviewHandler;
  let pageTemplateRepository: any;
  let templateVersionRepository: any;
  let templatePreviewLoader: any;
  let templateListingRepository: any;

  const templateId = '11111111-1111-1111-1111-111111111111';
  const versionId = '22222222-2222-2222-2222-222222222222';
  const demoVersionId = '33333333-3333-3333-3333-333333333333';
  const creatorId = '44444444-4444-4444-4444-444444444444';

  const mockPublicTemplate = {
    template: {
      getId: () => templateId,
      getName: () => 'Public Template',
    },
    version: {
      getId: () => versionId,
      getVersionNumber: () => 1,
      getTemplateId: () => templateId,
    },
  };

  const createMockListing = (
    offerType: TemplateOfferType,
    previewMode: TemplatePreviewMode,
    demoVerId?: string | null,
    demoConfig?: Record<string, any> | null,
  ) => {
    const listing = TemplateListing.create({
      id: 'listing-1',
      templateId,
      createdBy: creatorId,
      offerType,
      price:
        offerType === TemplateOfferType.PAID
          ? TemplatePrice.create({ amount: 50000, currency: 'VND' })
          : undefined,
      previewMode,
      demoVersionId: demoVerId === versionId ? null : (demoVerId ?? null),
      demoConfig: demoConfig ?? null,
    });
    listing.selectPublishedVersion({
      getId: () => versionId,
      getTemplateId: () => templateId,
      isDraft: () => false,
    });
    listing.publish();
    if (demoVerId === versionId) {
      jest.spyOn(listing, 'getDemoVersionId').mockReturnValue(versionId);
    }
    return listing;
  };

  beforeEach(() => {
    pageTemplateRepository = {
      findPublicById: jest.fn().mockResolvedValue(mockPublicTemplate),
    };
    templateVersionRepository = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === demoVersionId) {
          return Promise.resolve({
            getId: () => demoVersionId,
            getVersionNumber: () => 2,
            getTemplateId: () => templateId,
            isPublished: () => true,
          });
        }
        return Promise.resolve(null);
      }),
    };
    templatePreviewLoader = {
      loadFrom: jest.fn().mockImplementation((template, version) =>
        Promise.resolve({
          template: { id: template.getId(), name: template.getName() },
          version: {
            id: version.getId(),
            versionNumber: version.getVersionNumber(),
          },
          blocks: [],
          databases: [],
        }),
      ),
    };
    templateListingRepository = {
      findByTemplateId: jest
        .fn()
        .mockResolvedValue(
          createMockListing(
            TemplateOfferType.FREE,
            TemplatePreviewMode.INTERACTIVE,
          ),
        ),
    };

    handler = new GetPublicTemplatePreviewHandler(
      pageTemplateRepository,
      templateVersionRepository,
      templatePreviewLoader,
      templateListingRepository,
    );
  });

  it('throws NotFoundException if template is not found or not public', async () => {
    pageTemplateRepository.findPublicById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if listing is not found', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(NotFoundException);
  });

  it('blocks an unpublished listing even if it retains the pinned version', async () => {
    const listing = createMockListing(
      TemplateOfferType.FREE,
      TemplatePreviewMode.INTERACTIVE,
    );
    listing.unpublish();
    templateListingRepository.findByTemplateId.mockResolvedValue(listing);
    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(NotFoundException);
  });

  it('blocks a listing without a pinned version', async () => {
    const listing = createMockListing(
      TemplateOfferType.FREE,
      TemplatePreviewMode.INTERACTIVE,
    );
    jest.spyOn(listing, 'getPublishedVersionId').mockReturnValue(null);
    templateListingRepository.findByTemplateId.mockResolvedValue(listing);
    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if listing preview mode is IMAGE', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(TemplateOfferType.PAID, TemplatePreviewMode.IMAGE),
    );

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns interactive preview for FREE template in INTERACTIVE mode', async () => {
    const result = await handler.execute(
      new GetPublicTemplatePreviewQuery(templateId, versionId),
    );

    expect(result.interactive).toBe(true);
    expect(result.isDemo).toBe(false);
    expect(result.demoConfig).toBeNull();
    expect(templatePreviewLoader.loadFrom).toHaveBeenCalledWith(
      mockPublicTemplate.template,
      mockPublicTemplate.version,
    );
  });

  it('throws NotFoundException if FREE template version on URL does not match published version', async () => {
    await expect(
      handler.execute(
        new GetPublicTemplatePreviewQuery(templateId, 'other-version'),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('FAIL CLOSED: throws ForbiddenException for PAID + INTERACTIVE when demo_version_id is null', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(
        TemplateOfferType.PAID,
        TemplatePreviewMode.INTERACTIVE,
        null,
      ),
    );

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('FAIL CLOSED: throws ForbiddenException if demo version does not exist', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(
        TemplateOfferType.PAID,
        TemplatePreviewMode.INTERACTIVE,
        'non-existent-version',
      ),
    );
    templateVersionRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('FAIL CLOSED: throws ForbiddenException if demo version belongs to a different template', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(
        TemplateOfferType.PAID,
        TemplatePreviewMode.INTERACTIVE,
        demoVersionId,
      ),
    );
    templateVersionRepository.findById.mockResolvedValue({
      getId: () => demoVersionId,
      getVersionNumber: () => 2,
      getTemplateId: () => 'different-template-id',
      isPublished: () => true,
    });

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('FAIL CLOSED: throws ForbiddenException if demo version is not published', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(
        TemplateOfferType.PAID,
        TemplatePreviewMode.INTERACTIVE,
        demoVersionId,
      ),
    );
    templateVersionRepository.findById.mockResolvedValue({
      getId: () => demoVersionId,
      getVersionNumber: () => 2,
      getTemplateId: () => templateId,
      isPublished: () => false,
    });

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('FAIL CLOSED: throws ForbiddenException if demo version is same as published paid version', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(
        TemplateOfferType.PAID,
        TemplatePreviewMode.INTERACTIVE,
        versionId, // Same as published version
      ),
    );
    templateVersionRepository.findById.mockResolvedValue({
      getId: () => versionId,
      getVersionNumber: () => 1,
      getTemplateId: () => templateId,
      isPublished: () => true,
    });

    await expect(
      handler.execute(new GetPublicTemplatePreviewQuery(templateId, versionId)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('loads and returns demo version for PAID template even if query.versionId points to published version', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(
        TemplateOfferType.PAID,
        TemplatePreviewMode.INTERACTIVE,
        demoVersionId,
        { dummyData: true },
      ),
    );

    const result = await handler.execute(
      new GetPublicTemplatePreviewQuery(templateId, versionId),
    );

    expect(result.interactive).toBe(true);
    expect(result.isDemo).toBe(true);
    expect(result.demoConfig).toEqual({ dummyData: true });
    expect(templateVersionRepository.findById).toHaveBeenCalledWith(
      demoVersionId,
    );
    expect(templatePreviewLoader.loadFrom).toHaveBeenCalledWith(
      mockPublicTemplate.template,
      expect.objectContaining({ getId: expect.any(Function) }),
    );
    expect(result.version.id).toBe(demoVersionId);
  });

  it('throws NotFoundException if query.versionId does not match template or demo version', async () => {
    templateListingRepository.findByTemplateId.mockResolvedValue(
      createMockListing(
        TemplateOfferType.PAID,
        TemplatePreviewMode.INTERACTIVE,
        demoVersionId,
      ),
    );

    await expect(
      handler.execute(
        new GetPublicTemplatePreviewQuery(
          templateId,
          'random-unrelated-version',
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
