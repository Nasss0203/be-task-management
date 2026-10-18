import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateTemplateListingPricingHandler } from './update-template-listing-pricing.handler';
import { UpdateTemplateListingPricingCommand } from './update-template-listing-pricing.command';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../../domain/enums/template-preview-mode.enum';
import { PageTemplate } from '../../../../../template/domain/aggregates/page-template/page-template.aggregate';
import { TemplateListing } from '../../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingStatus } from '../../../../domain/enums/template-listing-status.enum';

describe('UpdateTemplateListingPricingHandler previewMode', () => {
  let handler: UpdateTemplateListingPricingHandler;
  let pageTemplateRepository: any;
  let templateListingRepository: any;
  let unitOfWork: any;
  let authorizationService: any;

  const templateId = '11111111-1111-1111-1111-111111111111';
  const creatorId = '22222222-2222-2222-2222-222222222222';
  const otherUserId = '33333333-3333-3333-3333-333333333333';

  const mockTemplate = PageTemplate.create({
    id: templateId,
    workspaceId: '44444444-4444-4444-4444-444444444444',
    name: 'Sample Template',
    createdBy: creatorId,
  });

  let mockListing: TemplateListing;
  let templateVersionRepository: any;

  beforeEach(() => {
    mockListing = TemplateListing.create({
      templateId,
      createdBy: creatorId,
      offerType: TemplateOfferType.FREE,
    });

    pageTemplateRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(mockTemplate),
    };
    templateVersionRepository = {
      findById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve({
          getId: () => id,
          getTemplateId: () => templateId,
          isPublished: () => true,
        }),
      ),
    };
    templateListingRepository = {
      findByTemplateId: jest.fn().mockImplementation(() => Promise.resolve(mockListing)),
      save: jest.fn().mockImplementation((listing) => Promise.resolve(listing)),
      findTagsByTemplateIds: jest.fn().mockResolvedValue(new Map()),
      findCategoriesByTemplateIds: jest.fn().mockResolvedValue(new Map()),
    };
    unitOfWork = {
      runInTransaction: jest.fn().mockImplementation((fn) => fn({})),
    };
    authorizationService = {
      authorize: jest.fn().mockResolvedValue(false),
    };

    handler = new UpdateTemplateListingPricingHandler(
      pageTemplateRepository,
      templateVersionRepository,
      templateListingRepository,
      unitOfWork,
      authorizationService,
      { loadFrom: jest.fn() } as any,
    );
  });

  it('updates only previewMode when pricing is not provided', async () => {
    expect(mockListing.getPreviewMode()).toBe(TemplatePreviewMode.INTERACTIVE);

    const result = await handler.execute(
      new UpdateTemplateListingPricingCommand(
        templateId,
        creatorId,
        undefined,
        undefined,
        undefined,
        TemplatePreviewMode.IMAGE,
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.IMAGE);
    expect(templateListingRepository.save).toHaveBeenCalled();
  });

  it('defaults to IMAGE when offer changes from FREE to PAID without explicit previewMode', async () => {
    expect(mockListing.getPreviewMode()).toBe(TemplatePreviewMode.INTERACTIVE);

    const result = await handler.execute(
      new UpdateTemplateListingPricingCommand(
        templateId,
        creatorId,
        TemplateOfferType.PAID,
        50000,
        'VND',
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.IMAGE);
    expect(result.offer_type).toBe(TemplateOfferType.PAID);
  });

  it('honors explicit previewMode when updating offer from FREE to PAID', async () => {
    const result = await handler.execute(
      new UpdateTemplateListingPricingCommand(
        templateId,
        creatorId,
        TemplateOfferType.PAID,
        50000,
        'VND',
        TemplatePreviewMode.INTERACTIVE,
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.INTERACTIVE);
    expect(result.offer_type).toBe(TemplateOfferType.PAID);
  });

  it('updates demoVersionId and demoConfig', async () => {
    const demoVerId = '66666666-6666-6666-6666-666666666666';
    const demoCfg = { readOnlyView: true };

    const result = await handler.execute(
      new UpdateTemplateListingPricingCommand(
        templateId,
        creatorId,
        TemplateOfferType.PAID,
        70000,
        'VND',
        TemplatePreviewMode.INTERACTIVE,
        demoVerId,
        demoCfg,
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.INTERACTIVE);
    expect(result.demo_version_id).toBe(demoVerId);
    expect(result.demo_config).toEqual(demoCfg);
  });

  it('rejects update if user is neither creator nor workspace manager', async () => {
    authorizationService.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(
        new UpdateTemplateListingPricingCommand(
          templateId,
          otherUserId,
          undefined,
          undefined,
          undefined,
          TemplatePreviewMode.IMAGE,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects update if demoVersion does not exist', async () => {
    templateVersionRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateTemplateListingPricingCommand(
          templateId,
          creatorId,
          TemplateOfferType.PAID,
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          'missing-demo-version',
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update if demoVersion belongs to different template', async () => {
    templateVersionRepository.findById.mockResolvedValue({
      getId: () => 'wrong-template-version',
      getTemplateId: () => 'other-template-id',
      isPublished: () => true,
    });

    await expect(
      handler.execute(
        new UpdateTemplateListingPricingCommand(
          templateId,
          creatorId,
          TemplateOfferType.PAID,
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          'wrong-template-version',
        ),
      ),
    ).rejects.toThrow('Demo version does not belong to this template');
  });

  it('rejects update if demoVersion is draft', async () => {
    templateVersionRepository.findById.mockResolvedValue({
      getId: () => 'draft-demo-version',
      getTemplateId: () => templateId,
      isPublished: () => false,
    });

    await expect(
      handler.execute(
        new UpdateTemplateListingPricingCommand(
          templateId,
          creatorId,
          TemplateOfferType.PAID,
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          'draft-demo-version',
        ),
      ),
    ).rejects.toThrow('Demo version must be a published template version');
  });

  it('rejects update if demoVersion is same as published paid version', async () => {
    const publishedVerId = '88888888-8888-8888-8888-888888888888';
    mockListing.selectPublishedVersion({
      getId: () => publishedVerId,
      getTemplateId: () => templateId,
      isDraft: () => false,
    });

    templateVersionRepository.findById.mockResolvedValue({
      getId: () => publishedVerId,
      getTemplateId: () => templateId,
      isPublished: () => true,
    });

    await expect(
      handler.execute(
        new UpdateTemplateListingPricingCommand(
          templateId,
          creatorId,
          TemplateOfferType.PAID,
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          publishedVerId,
        ),
      ),
    ).rejects.toThrow('A paid demo that uses the released version requires a LIMITED demo_config');
  });
  describe('same-version LIMITED demo', () => {
    const publishedVerId = '88888888-8888-4888-8888-888888888888';
    const blockId = '55555555-5555-4555-8555-555555555555';
    const limitedConfig = { schema: 1, scope: 'LIMITED', block_ids: [blockId] };
    let loadFrom: jest.Mock;

    beforeEach(() => {
      mockListing = TemplateListing.restore({
        id: '99999999-9999-4999-8999-999999999999',
        templateId,
        offerType: TemplateOfferType.FREE,
        status: TemplateListingStatus.PUBLISHED,
        createdBy: creatorId,
        publishedVersionId: publishedVerId,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      loadFrom = jest.fn().mockResolvedValue({
        blocks: [{ id: blockId }],
        databases: [],
      });
      handler = new UpdateTemplateListingPricingHandler(
        pageTemplateRepository,
        templateVersionRepository,
        templateListingRepository,
        unitOfWork,
        authorizationService,
        { loadFrom } as any,
      );
    });

    const update = (
      demoVersionId?: string | null,
      demoConfig?: Record<string, unknown> | null,
    ) =>
      handler.execute(
        new UpdateTemplateListingPricingCommand(
          templateId,
          creatorId,
          TemplateOfferType.PAID,
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          demoVersionId,
          demoConfig,
        ),
      );

    it('accepts the released version as a LIMITED demo', async () => {
      const result = await update(publishedVerId, limitedConfig);

      expect(result.demo_version_id).toBe(publishedVerId);
      expect(result.demo_config).toEqual(limitedConfig);
      expect(loadFrom).toHaveBeenCalled();
    });

    it('rejects the released version without a config', async () => {
      await expect(update(publishedVerId)).rejects.toThrow(
        'requires a LIMITED demo_config',
      );
      expect(templateListingRepository.save).not.toHaveBeenCalled();
    });

    it('rejects ids that are not part of the demo version', async () => {
      loadFrom.mockResolvedValue({ blocks: [], databases: [] });
      await expect(update(publishedVerId, limitedConfig)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an invalid schema-1 config', async () => {
      await expect(
        update(publishedVerId, { schema: 1, scope: 'LIMITED', block_ids: ['x'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('clears the demo version with null', async () => {
      await update('77777777-7777-4777-8777-777777777777', null);
      const result = await update(null);

      expect(result.demo_version_id).toBeNull();
      expect(result.demo_config).toBeNull();
    });
  });
});
