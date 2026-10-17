import { ForbiddenException } from '@nestjs/common';

import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { TemplatePreviewResponseDto } from 'src/modules/template/application/dto/template-preview/template-preview.response.dto';
import { TemplateStatus } from 'src/modules/template/domain/enums/template-status.enum';
import { TemplateVisibility } from 'src/modules/template/domain/enums/template-visibility.enum';
import { GetTemplatePreviewHandler } from 'src/modules/template/application/queries/template-preview/get-template-preview/get-template-preview.handler';
import { GetTemplatePreviewQuery } from 'src/modules/template/application/queries/template-preview/get-template-preview/get-template-preview.query';

import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../../domain/enums/template-preview-mode.enum';
import { TemplatePrice } from '../../../domain/value-objects/template-price.vo';
import { GetPublicTemplatePreviewHandler } from './get-public-template-preview/get-public-template-preview.handler';
import { GetPublicTemplatePreviewQuery } from './get-public-template-preview/get-public-template-preview.query';

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TEMPLATE = id(1);
const RELEASE = id(2);
const VISITOR = id(3);
const B_PUBLIC = id(10);
const B_SECRET = id(11);
const B_DB = id(12);
const DB = id(20);
const VIEW = id(21);
const P_TITLE = id(30);
const P_SECRET = id(31);
const ROWS = [id(40), id(41), id(42)];

const limitedConfig = {
  schema: 1,
  scope: 'LIMITED',
  block_ids: [B_PUBLIC, B_DB],
  databases: { [DB]: { view_ids: [VIEW], property_ids: [], row_limit: 1 } },
};

function fullSnapshot() {
  const block = (blockId: string, type: PageBlockType, extra = {}) =>
    ({
      id: blockId,
      parent_block_id: null,
      type,
      content: { text: blockId === B_SECRET ? 'PAID SECRET' : 'intro' },
      style_config: {},
      data_config: {},
      ...extra,
    }) as any;
  const properties = [
    { id: P_TITLE, type: PropertyType.TITLE, options: [] },
    { id: P_SECRET, type: PropertyType.TEXT, options: [] },
  ] as any[];
  return new TemplatePreviewResponseDto({
    template: { id: TEMPLATE } as any,
    version: { id: RELEASE } as any,
    blocks: [
      block(B_PUBLIC, PageBlockType.TEXT),
      block(B_SECRET, PageBlockType.TEXT),
      block(B_DB, PageBlockType.DATABASE_VIEW, {
        data_config: { database_id: DB, view_id: VIEW },
      }),
    ],
    databases: [
      {
        id: DB,
        properties,
        rows: ROWS.map((rowId) => ({
          id: rowId,
          values: properties.map((p) => ({
            template_property_id: p.id,
            value:
              p.id === P_SECRET ? `SECRET VALUE ${rowId}` : `title ${rowId}`,
          })),
        })),
        views: [
          {
            id: VIEW,
            properties: properties.map((p) => ({ template_property_id: p.id })),
          },
        ],
      } as any,
    ],
  });
}

function paidListing(demoConfig: Record<string, any> | null) {
  const listing = TemplateListing.restore({
    id: id(50),
    templateId: TEMPLATE,
    offerType: TemplateOfferType.PAID,
    price: TemplatePrice.create({ amount: 99000, currency: 'VND' }),
    status: 'PUBLISHED' as any,
    previewMode: TemplatePreviewMode.INTERACTIVE,
    demoVersionId: RELEASE,
    demoConfig,
    createdBy: id(60),
    publishedVersionId: RELEASE,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return listing;
}

const releaseVersion = {
  getId: () => RELEASE,
  getTemplateId: () => TEMPLATE,
  isPublished: () => true,
  isDraft: () => false,
};

function expectNoPaidContent(result: TemplatePreviewResponseDto) {
  const text = JSON.stringify(result);
  expect(text).not.toContain('PAID SECRET');
  expect(text).not.toContain('SECRET VALUE');
  expect(text).not.toContain(P_SECRET);
  expect(text).not.toContain(ROWS[1]);
  expect(result.blocks.map((b) => b.id)).toEqual([B_PUBLIC, B_DB]);
  expect(result.databases[0].rows.map((r) => r.id)).toEqual([ROWS[0]]);
  expect(result.demoScope).toBe('LIMITED');
  expect(result.hiddenContent).toEqual({ blocks: 1, rows: 2 });
  expect(result.demoConfig).toBeNull();
  expect(result.isDemo).toBe(true);
}

describe('Same-version LIMITED demo preview', () => {
  let loader: { loadFrom: jest.Mock };

  beforeEach(() => {
    loader = { loadFrom: jest.fn().mockImplementation(() => fullSnapshot()) };
  });

  describe('public endpoint', () => {
    const handler = (listing: TemplateListing) =>
      new GetPublicTemplatePreviewHandler(
        {
          findPublicById: jest.fn().mockResolvedValue({
            template: { getId: () => TEMPLATE },
            version: releaseVersion,
          }),
        } as any,
        { findById: jest.fn() } as any,
        loader as any,
        { findByTemplateId: jest.fn().mockResolvedValue(listing) } as any,
      );

    it('serves only allowlisted content of the released version', async () => {
      const result = await handler(paidListing(limitedConfig)).execute(
        new GetPublicTemplatePreviewQuery(TEMPLATE, RELEASE),
      );
      expectNoPaidContent(result);
    });

    it('fails closed when the stored config is missing', async () => {
      // Bypass write validation to simulate a corrupted row.
      const listing = paidListing(limitedConfig);
      jest.spyOn(listing, 'getDemoConfig').mockReturnValue(null);
      await expect(
        handler(listing).execute(
          new GetPublicTemplatePreviewQuery(TEMPLATE, RELEASE),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('fails closed when the stored config no longer matches the snapshot', async () => {
      loader.loadFrom.mockImplementation(() => {
        const snapshot = fullSnapshot();
        snapshot.blocks = snapshot.blocks.filter((b) => b.id !== B_PUBLIC);
        return snapshot;
      });
      await expect(
        handler(paidListing(limitedConfig)).execute(
          new GetPublicTemplatePreviewQuery(TEMPLATE, RELEASE),
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('signed-in visitor without entitlement', () => {
    it('gets the same filtered content as anonymous visitors', async () => {
      const handler = new GetTemplatePreviewHandler(
        {
          findById: jest.fn().mockResolvedValue({
            getId: () => TEMPLATE,
            getCreatedBy: () => id(60),
            getWorkspaceId: () => id(61),
            getVisibility: () => TemplateVisibility.PUBLIC,
            getStatus: () => TemplateStatus.PUBLISHED,
          }),
        } as any,
        { findById: jest.fn().mockResolvedValue(releaseVersion) } as any,
        {} as any,
        { authorize: jest.fn().mockResolvedValue(false) } as any,
        {} as any,
        loader as any,
        {
          findByTemplateId: jest
            .fn()
            .mockResolvedValue(paidListing(limitedConfig)),
        } as any,
        { findByTemplateAndUser: jest.fn().mockResolvedValue(null) } as any,
        { findByTemplateAndVersion: jest.fn().mockResolvedValue(null) } as any,
      );

      const result = await handler.execute(
        new GetTemplatePreviewQuery(TEMPLATE, RELEASE, VISITOR),
      );
      expectNoPaidContent(result);
    });
  });
});
