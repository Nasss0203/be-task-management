import { TemplateEntitlementSource } from 'src/modules/marketplace/domain/enums/template-entitlement-source.enum';
import { TemplateOfferType } from 'src/modules/marketplace/domain/enums/template-offer-type.enum';

import { GetUsableTemplateVersionsHandler } from './get-usable-template-versions.handler';
import { GetUsableTemplateVersionsQuery } from './get-usable-template-versions.query';

const TEMPLATE = 'template-1';
const BUYER = 'buyer-1';
const V1 = 'version-1';
const V2 = 'version-2';

const version = (id: string, versionNumber: number) => ({
  getId: () => id,
  getTemplateId: () => TEMPLATE,
  getVersionNumber: () => versionNumber,
  getStatus: () => 'PUBLISHED',
  isPublished: () => true,
});

const release = (versionId: string, offerTypeAtRelease: TemplateOfferType) => ({
  getTemplateId: () => TEMPLATE,
  getVersionId: () => versionId,
  getOfferTypeAtRelease: () => offerTypeAtRelease,
  getReleasedAt: () => new Date('2026-10-01T00:00:00Z'),
});

function handlerFor(source: TemplateEntitlementSource) {
  return new GetUsableTemplateVersionsHandler(
    {
      findById: jest.fn().mockResolvedValue({
        getCreatedBy: () => 'creator',
        getWorkspaceId: () => 'workspace',
      }),
    } as any,
    {
      findByTemplateId: jest
        .fn()
        .mockResolvedValue([version(V1, 1), version(V2, 2)]),
    } as any,
    {
      // V2 is both the current release and the (LIMITED) demo.
      findByTemplateId: jest.fn().mockResolvedValue({
        getDemoVersionId: () => V2,
        getPublishedVersionId: () => V2,
      }),
    } as any,
    {
      findByTemplateAndUser: jest
        .fn()
        .mockResolvedValue({ getSource: () => source }),
    } as any,
    {
      findByTemplateId: jest
        .fn()
        .mockResolvedValue([
          release(V1, TemplateOfferType.FREE),
          release(V2, TemplateOfferType.PAID),
        ]),
    } as any,
    { authorize: jest.fn().mockResolvedValue(false) } as any,
  );
}

describe('GetUsableTemplateVersionsHandler', () => {
  it('keeps a paid release usable for buyers when it is also the demo', async () => {
    const result = await handlerFor(
      TemplateEntitlementSource.PAID_PURCHASE,
    ).execute(new GetUsableTemplateVersionsQuery(TEMPLATE, BUYER));

    expect(result.items.map((item) => item.id)).toEqual([V1, V2]);
    expect(result.items.find((item) => item.id === V2)?.is_current).toBe(true);
  });

  it('never lists paid releases for a FREE_CLAIM', async () => {
    const result = await handlerFor(
      TemplateEntitlementSource.FREE_CLAIM,
    ).execute(new GetUsableTemplateVersionsQuery(TEMPLATE, BUYER));

    expect(result.items.map((item) => item.id)).toEqual([V1]);
  });
});
