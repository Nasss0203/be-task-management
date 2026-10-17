import { NotFoundException } from '@nestjs/common';

import { TemplateEntitlementSource } from 'src/modules/marketplace/domain/enums/template-entitlement-source.enum';
import { TemplateOfferType } from 'src/modules/marketplace/domain/enums/template-offer-type.enum';
import { TemplateVersionAssetStatus } from 'src/modules/template/domain/enums/template-version-asset-status.enum';

import { GetTemplateVersionThumbnailHandler } from './get-template-version-thumbnail.handler';
import { GetTemplateVersionThumbnailQuery } from './get-template-version-thumbnail.query';

const TEMPLATE = 'template-1';
const RELEASE = 'release-version';
const DEMO = 'demo-version';
const CREATOR = 'creator';
const BUYER = 'buyer';
const VISITOR = 'visitor';

const version = (id: string) => ({
  getId: () => id,
  getTemplateId: () => TEMPLATE,
  getStatus: () => 'PUBLISHED',
  getCreatedBy: () => CREATOR,
});

type ListingSetup = {
  offerType?: TemplateOfferType;
  demoVersionId?: string | null;
  demoConfig?: Record<string, unknown> | null;
} | null;

function setup(
  listing: ListingSetup,
  entitlementSource?: TemplateEntitlementSource,
) {
  const assets = {
    findByVersionAndType: jest.fn().mockImplementation((versionId: string) =>
      Promise.resolve({
        getStatus: () => TemplateVersionAssetStatus.READY,
        getMimeType: () => 'image/png',
        getWidth: () => 1200,
        getHeight: () => 630,
        getStorageKey: () => `thumbnails/${versionId}.png`,
      }),
    ),
  };
  const storage = {
    getSignedDownloadUrl: jest
      .fn()
      .mockImplementation((key: string) =>
        Promise.resolve(`https://signed/${key}`),
      ),
  };
  const handler = new GetTemplateVersionThumbnailHandler(
    {
      findById: jest.fn().mockResolvedValue({
        getId: () => TEMPLATE,
        getVisibility: () => 'PUBLIC',
        getCreatedBy: () => CREATOR,
        getWorkspaceId: () => 'workspace',
      }),
    } as any,
    {
      findById: jest
        .fn()
        .mockImplementation((id: string) => Promise.resolve(version(id))),
    } as any,
    assets as any,
    storage as any,
    { authorize: jest.fn().mockResolvedValue(false) } as any,
    {
      findByTemplateId: jest.fn().mockResolvedValue(
        listing && {
          getOfferType: () => listing.offerType ?? TemplateOfferType.PAID,
          getDemoVersionId: () => listing.demoVersionId ?? null,
          getDemoConfig: () => listing.demoConfig ?? null,
          getPublishedVersionId: () => RELEASE,
        },
      ),
    } as any,
    {
      findByTemplateAndUser: jest
        .fn()
        .mockResolvedValue(
          entitlementSource ? { getSource: () => entitlementSource } : null,
        ),
    } as any,
    {
      findByTemplateAndVersion: jest
        .fn()
        .mockResolvedValue(
          listing
            ? {
                getOfferTypeAtRelease: () =>
                  listing.offerType ?? TemplateOfferType.PAID,
              }
            : null,
        ),
    } as any,
  );
  return { handler, storage };
}

const fetch = (handler: GetTemplateVersionThumbnailHandler, userId?: string) =>
  handler.execute(
    new GetTemplateVersionThumbnailQuery(TEMPLATE, RELEASE, userId),
  );

describe('GetTemplateVersionThumbnailHandler paid protection', () => {
  beforeEach(() =>
    jest.spyOn(console, 'log').mockImplementation(() => undefined),
  );
  afterEach(() => jest.restoreAllMocks());

  it('keeps FREE thumbnails public', async () => {
    const { handler } = setup({ offerType: TemplateOfferType.FREE });
    await expect(fetch(handler)).resolves.toMatchObject({
      url: `https://signed/thumbnails/${RELEASE}.png`,
    });
  });

  it('never returns a paid release screenshot to anonymous visitors', async () => {
    const { handler, storage } = setup({ demoVersionId: null });
    await expect(fetch(handler)).rejects.toThrow(NotFoundException);
    expect(storage.getSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('serves the separate demo screenshot instead of the paid release', async () => {
    const { handler } = setup({ demoVersionId: DEMO });
    await expect(fetch(handler, VISITOR)).resolves.toMatchObject({
      url: `https://signed/thumbnails/${DEMO}.png`,
    });
  });

  it('does not picture a same-version LIMITED demo', async () => {
    const { handler, storage } = setup({
      demoVersionId: RELEASE,
      demoConfig: {
        schema: 1,
        scope: 'LIMITED',
        block_ids: ['00000000-0000-4000-8000-000000000001'],
      },
    });
    await expect(fetch(handler)).rejects.toThrow(NotFoundException);
    expect(storage.getSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('does not picture a separate demo that is itself LIMITED', async () => {
    const { handler } = setup({
      demoVersionId: DEMO,
      demoConfig: {
        schema: 1,
        scope: 'LIMITED',
        block_ids: ['00000000-0000-4000-8000-000000000001'],
      },
    });
    await expect(fetch(handler)).rejects.toThrow(NotFoundException);
  });

  it('shows the real screenshot to the creator and to paying buyers', async () => {
    const creator = setup({ demoVersionId: null }).handler;
    await expect(fetch(creator, CREATOR)).resolves.toMatchObject({
      url: `https://signed/thumbnails/${RELEASE}.png`,
    });

    const buyer = setup(
      { demoVersionId: null },
      TemplateEntitlementSource.PAID_PURCHASE,
    ).handler;
    await expect(fetch(buyer, BUYER)).resolves.toMatchObject({
      url: `https://signed/thumbnails/${RELEASE}.png`,
    });
  });

  it('treats a FREE_CLAIM like any visitor for paid content', async () => {
    const { handler } = setup(
      { demoVersionId: null },
      TemplateEntitlementSource.FREE_CLAIM,
    );
    await expect(fetch(handler, BUYER)).rejects.toThrow(NotFoundException);
  });
});
