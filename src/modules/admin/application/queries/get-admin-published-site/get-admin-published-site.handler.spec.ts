import { NotFoundException } from '@nestjs/common';

import type { PublicationAvailabilityService } from 'src/modules/content/application/services/publication-availability.service';
import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';

import type {
  AdminPublishedSitePageRow,
  AdminPublishedSiteReader,
  AdminPublishedSiteSummary,
} from '../../ports/admin-published-site-reader.port';
import { GetAdminPublishedSiteHandler } from './get-admin-published-site.handler';

const SITE_ID = '11111111-1111-4111-8111-111111111111';

function pageRow(
  publicationId: string,
  overrides: Partial<AdminPublishedSitePageRow> = {},
): AdminPublishedSitePageRow {
  return {
    publicationId,
    pageId: `page-${publicationId}`,
    title: publicationId,
    path: `/${publicationId}`,
    publicationType: 'DIRECT' as AdminPublishedSitePageRow['publicationType'],
    includeDescendants: false,
    pageDeletedAt: null,
    publishedBy: { id: 'u1', email: 'a@example.test', username: 'a' },
    publishedAt: new Date('2026-11-01T00:00:00Z'),
    unpublishedAt: null,
    ...overrides,
  };
}

function createHandler(options: {
  disabledAt?: Date | null;
  pages: AdminPublishedSitePageRow[];
  livePublicationIds: string[];
  siteExists?: boolean;
}) {
  const summary = {
    id: SITE_ID,
    disabledAt: options.disabledAt ?? null,
  } as AdminPublishedSiteSummary;
  const reader = {
    findSiteDetail: jest
      .fn()
      .mockResolvedValue(
        options.siteExists === false
          ? null
          : { site: summary, pages: options.pages },
      ),
  } as unknown as AdminPublishedSiteReader;
  const sites = {
    findById: jest
      .fn()
      .mockResolvedValue(options.siteExists === false ? null : { id: SITE_ID }),
  } as unknown as PublishedSiteRepository;
  const publications = {
    findBySiteId: jest
      .fn()
      .mockResolvedValue(
        options.pages.map((page) => ({ getId: () => page.publicationId })),
      ),
  } as unknown as PagePublicationRepository;
  const availability = {
    isAvailable: jest.fn(
      (_site: unknown, publication: { getId: () => string }) =>
        Promise.resolve(
          options.livePublicationIds.includes(publication.getId()),
        ),
    ),
  } as unknown as PublicationAvailabilityService;

  return new GetAdminPublishedSiteHandler(
    reader,
    sites,
    publications,
    availability,
  );
}

describe('GetAdminPublishedSiteHandler', () => {
  it('throws not found when the site does not exist', async () => {
    const handler = createHandler({
      pages: [],
      livePublicationIds: [],
      siteExists: false,
    });

    await expect(handler.execute(SITE_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('marks pages live from the availability service', async () => {
    const handler = createHandler({
      pages: [pageRow('root'), pageRow('hidden')],
      livePublicationIds: ['root'],
    });

    const result = await handler.execute(SITE_ID);

    expect(
      result.pages.map(({ live, notLiveReason }) => [live, notLiveReason]),
    ).toEqual([
      [true, null],
      [false, 'NOT_REACHABLE'],
    ]);
  });

  it('explains why a page is not live, site status first', async () => {
    const pages = [
      pageRow('unpublished', { unpublishedAt: new Date() }),
      pageRow('trashed', { pageDeletedAt: new Date() }),
    ];

    const active = await createHandler({
      pages,
      livePublicationIds: [],
    }).execute(SITE_ID);
    const disabled = await createHandler({
      pages,
      livePublicationIds: [],
      disabledAt: new Date(),
    }).execute(SITE_ID);

    expect(active.pages.map((page) => page.notLiveReason)).toEqual([
      'UNPUBLISHED',
      'PAGE_IN_TRASH',
    ]);
    expect(disabled.pages.map((page) => page.notLiveReason)).toEqual([
      'SITE_DISABLED',
      'SITE_DISABLED',
    ]);
  });
});
