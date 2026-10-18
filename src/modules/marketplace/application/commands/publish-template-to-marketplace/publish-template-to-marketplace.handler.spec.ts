import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PublishTemplateToMarketplaceHandler } from './publish-template-to-marketplace.handler';
import { PublishTemplateToMarketplaceCommand } from './publish-template-to-marketplace.command';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../domain/enums/template-preview-mode.enum';
import { PageTemplate } from '../../../../template/domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../template/domain/aggregates/template-version/template-version.aggregate';
import { TemplateStatus } from '../../../../template/domain/enums/template-status.enum';

describe('PublishTemplateToMarketplaceHandler Security & Demo Isolation', () => {
  let handler: PublishTemplateToMarketplaceHandler;
  let templates: any;
  let versions: any;
  let listings: any;
  let categories: any;
  let releases: any;
  let uow: any;
  let authorization: any;

  const templateId = '11111111-1111-1111-1111-111111111111';
  const versionId = '22222222-2222-2222-2222-222222222222';
  const demoVersionId = '33333333-3333-3333-3333-333333333333';
  const creatorId = '44444444-4444-4444-4444-444444444444';

  const mockTemplate = PageTemplate.create({
    id: templateId,
    workspaceId: 'workspace-1',
    name: 'Test Template',
    createdBy: creatorId,
  });

  const createMockVersion = (id: string, isPublished = true) => {
    const version = TemplateVersion.create({
      id,
      templateId,
      versionNumber: 1,
      createdBy: creatorId,
    });
    if (isPublished) version.publish();
    return version;
  };

  beforeEach(() => {
    templates = {
      findByIdForUpdate: jest.fn().mockResolvedValue(mockTemplate),
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
    };
    versions = {
      findByIdForUpdate: jest.fn().mockImplementation((id: string) => {
        if (id === versionId)
          return Promise.resolve(createMockVersion(versionId));
        return Promise.resolve(null);
      }),
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === demoVersionId)
          return Promise.resolve(createMockVersion(demoVersionId));
        if (id === versionId)
          return Promise.resolve(createMockVersion(versionId));
        return Promise.resolve(null);
      }),
      save: jest.fn().mockImplementation((v) => Promise.resolve(v)),
    };
    listings = {
      findByTemplateId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((l) => Promise.resolve(l)),
      save: jest.fn().mockImplementation((l) => Promise.resolve(l)),
      replaceCategoryIds: jest.fn().mockResolvedValue(undefined),
      findTagsByTemplateIds: jest.fn().mockResolvedValue(new Map()),
      findCategoriesByTemplateIds: jest.fn().mockResolvedValue(new Map()),
    };
    categories = {
      findByIdsForShare: jest.fn().mockResolvedValue([]),
    };
    releases = {
      existsByTemplateAndVersion: jest.fn().mockResolvedValue(false),
      insertIfAbsent: jest.fn().mockResolvedValue(undefined),
    };
    uow = {
      runInTransaction: jest.fn().mockImplementation((fn) => fn({})),
    };
    authorization = {
      authorize: jest.fn().mockResolvedValue(false),
    };

    handler = new PublishTemplateToMarketplaceHandler(
      templates,
      versions,
      listings,
      uow,
      authorization,
      categories,
      releases,
      { loadFrom: jest.fn() } as any,
    );
  });

  it('publishes PAID listing with valid demoVersionId and demoConfig', async () => {
    const result = await handler.execute(
      new PublishTemplateToMarketplaceCommand(
        templateId,
        versionId,
        creatorId,
        TemplateOfferType.PAID,
        [],
        50000,
        'VND',
        TemplatePreviewMode.INTERACTIVE,
        demoVersionId,
        { sandbox: true },
      ),
    );

    expect(result.listing.offer_type).toBe(TemplateOfferType.PAID);
    expect(result.listing.preview_mode).toBe(TemplatePreviewMode.INTERACTIVE);
    expect(result.listing.demo_version_id).toBe(demoVersionId);
    expect(result.listing.demo_config).toEqual({ sandbox: true });
    expect(releases.insertIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId,
        versionId,
        releasedBy: creatorId,
        offerTypeAtRelease: TemplateOfferType.PAID,
      }),
      expect.anything(),
    );
  });

  it('does not create a duplicate release when the version was released before', async () => {
    releases.existsByTemplateAndVersion.mockResolvedValue(true);
    await handler.execute(
      new PublishTemplateToMarketplaceCommand(
        templateId,
        versionId,
        creatorId,
        TemplateOfferType.FREE,
      ),
    );
    expect(releases.insertIfAbsent).not.toHaveBeenCalled();
    expect(listings.save).toHaveBeenCalled();
  });

  it('requires an already published template version', async () => {
    versions.findByIdForUpdate.mockResolvedValue(
      createMockVersion(versionId, false),
    );
    await expect(
      handler.execute(
        new PublishTemplateToMarketplaceCommand(
          templateId,
          versionId,
          creatorId,
          TemplateOfferType.FREE,
        ),
      ),
    ).rejects.toThrow('Template version must be published');
    expect(releases.insertIfAbsent).not.toHaveBeenCalled();
    expect(listings.save).not.toHaveBeenCalled();
  });

  it('rejects publishing PAID listing if demoVersionId matches version being published', async () => {
    await expect(
      handler.execute(
        new PublishTemplateToMarketplaceCommand(
          templateId,
          versionId,
          creatorId,
          TemplateOfferType.PAID,
          [],
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          versionId, // Same as versionId being sold!
        ),
      ),
    ).rejects.toThrow(
      'A paid demo that uses the released version requires a LIMITED demo_config',
    );
  });

  describe('same-version LIMITED demo', () => {
    const blockId = '55555555-5555-4555-8555-555555555555';
    const limitedConfig = { schema: 1, scope: 'LIMITED', block_ids: [blockId] };
    const withLoader = (blockIds: string[]) =>
      new PublishTemplateToMarketplaceHandler(
        templates,
        versions,
        listings,
        uow,
        authorization,
        categories,
        releases,
        {
          loadFrom: jest.fn().mockResolvedValue({
            blocks: blockIds.map((id) => ({ id })),
            databases: [],
          }),
        } as any,
      );
    const command = (demoConfig?: Record<string, unknown>) =>
      new PublishTemplateToMarketplaceCommand(
        templateId,
        versionId,
        creatorId,
        TemplateOfferType.PAID,
        [],
        50000,
        'VND',
        TemplatePreviewMode.INTERACTIVE,
        versionId,
        demoConfig,
      );

    it('releases a PAID version that is also its LIMITED demo', async () => {
      const result = await withLoader([blockId]).execute(
        command(limitedConfig),
      );

      expect(result.listing.published_version_id).toBe(versionId);
      expect(result.listing.demo_version_id).toBe(versionId);
      expect(releases.insertIfAbsent).toHaveBeenCalled();
    });

    it('rejects a LIMITED config whose ids are not in the demo snapshot', async () => {
      await expect(
        withLoader(['66666666-6666-4666-8666-666666666666']).execute(
          command(limitedConfig),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(releases.insertIfAbsent).not.toHaveBeenCalled();
    });

    it('rejects a same-version FULL_VERSION config', async () => {
      await expect(
        withLoader([blockId]).execute(
          command({ schema: 1, scope: 'FULL_VERSION' }),
        ),
      ).rejects.toThrow('requires a LIMITED demo_config');
    });
  });

  it('rejects publishing if demoVersion does not exist', async () => {
    versions.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new PublishTemplateToMarketplaceCommand(
          templateId,
          versionId,
          creatorId,
          TemplateOfferType.PAID,
          [],
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          'non-existent-version',
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects publishing if demoVersion belongs to different template', async () => {
    versions.findById.mockResolvedValue({
      getId: () => demoVersionId,
      getTemplateId: () => 'different-template-id',
      isPublished: () => true,
    });

    await expect(
      handler.execute(
        new PublishTemplateToMarketplaceCommand(
          templateId,
          versionId,
          creatorId,
          TemplateOfferType.PAID,
          [],
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          demoVersionId,
        ),
      ),
    ).rejects.toThrow('Demo version does not belong to this template');
  });

  it('rejects publishing if demoVersion is draft', async () => {
    versions.findById.mockResolvedValue({
      getId: () => demoVersionId,
      getTemplateId: () => templateId,
      isPublished: () => false,
    });

    await expect(
      handler.execute(
        new PublishTemplateToMarketplaceCommand(
          templateId,
          versionId,
          creatorId,
          TemplateOfferType.PAID,
          [],
          50000,
          'VND',
          TemplatePreviewMode.INTERACTIVE,
          demoVersionId,
        ),
      ),
    ).rejects.toThrow('Demo version must be a published template version');
  });
});
