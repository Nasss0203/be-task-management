import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTemplateListingHandler } from './create-template-listing.handler';
import { CreateTemplateListingCommand } from './create-template-listing.command';
import { TemplateOfferType } from '../../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../../domain/enums/template-preview-mode.enum';
import { PageTemplate } from '../../../../../template/domain/aggregates/page-template/page-template.aggregate';
import { TemplateStatus } from '../../../../../template/domain/enums/template-status.enum';

describe('CreateTemplateListingHandler previewMode', () => {
  let handler: CreateTemplateListingHandler;
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

  let templateVersionRepository: any;

  beforeEach(() => {
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
      findByTemplateId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((listing) => Promise.resolve(listing)),
      findCategoriesByTemplateIds: jest.fn().mockResolvedValue(new Map()),
    };
    unitOfWork = {
      runInTransaction: jest.fn().mockImplementation((fn) => fn({})),
    };
    authorizationService = {
      authorize: jest.fn().mockResolvedValue(false),
    };

    handler = new CreateTemplateListingHandler(
      pageTemplateRepository,
      templateVersionRepository,
      templateListingRepository,
      unitOfWork,
      authorizationService,
      { loadFrom: jest.fn() } as any,
    );
  });

  it('creates FREE listing with default previewMode = INTERACTIVE when not specified', async () => {
    const result = await handler.execute(
      new CreateTemplateListingCommand(
        templateId,
        creatorId,
        TemplateOfferType.FREE,
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.INTERACTIVE);
    expect(templateListingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        previewMode: TemplatePreviewMode.INTERACTIVE,
      }),
      expect.anything(),
    );
  });

  it('creates PAID listing with default previewMode = IMAGE when not specified', async () => {
    const result = await handler.execute(
      new CreateTemplateListingCommand(
        templateId,
        creatorId,
        TemplateOfferType.PAID,
        50000,
        'VND',
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.IMAGE);
    expect(templateListingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        previewMode: TemplatePreviewMode.IMAGE,
      }),
      expect.anything(),
    );
  });

  it('honors explicitly configured previewMode for FREE listing', async () => {
    const result = await handler.execute(
      new CreateTemplateListingCommand(
        templateId,
        creatorId,
        TemplateOfferType.FREE,
        0,
        'VND',
        TemplatePreviewMode.IMAGE,
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.IMAGE);
  });

  it('honors explicitly configured previewMode for PAID listing', async () => {
    const result = await handler.execute(
      new CreateTemplateListingCommand(
        templateId,
        creatorId,
        TemplateOfferType.PAID,
        50000,
        'VND',
        TemplatePreviewMode.INTERACTIVE,
      ),
    );

    expect(result.preview_mode).toBe(TemplatePreviewMode.INTERACTIVE);
  });

  it('creates PAID listing with demoVersionId and demoConfig', async () => {
    const demoVerId = '55555555-5555-5555-5555-555555555555';
    const demoCfg = { initialPage: 'dashboard', allowEdit: false };

    const result = await handler.execute(
      new CreateTemplateListingCommand(
        templateId,
        creatorId,
        TemplateOfferType.PAID,
        50000,
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

  it('rejects listing creation if user is neither creator nor workspace manager', async () => {
    authorizationService.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(
        new CreateTemplateListingCommand(
          templateId,
          otherUserId,
          TemplateOfferType.FREE,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects listing creation if demoVersion does not exist', async () => {
    templateVersionRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new CreateTemplateListingCommand(
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

  it('rejects listing creation if demoVersion belongs to different template', async () => {
    templateVersionRepository.findById.mockResolvedValue({
      getId: () => 'wrong-template-version',
      getTemplateId: () => 'other-template-id',
      isPublished: () => true,
    });

    await expect(
      handler.execute(
        new CreateTemplateListingCommand(
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

  it('rejects listing creation if demoVersion is draft', async () => {
    templateVersionRepository.findById.mockResolvedValue({
      getId: () => 'draft-demo-version',
      getTemplateId: () => templateId,
      isPublished: () => false,
    });

    await expect(
      handler.execute(
        new CreateTemplateListingCommand(
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
});
