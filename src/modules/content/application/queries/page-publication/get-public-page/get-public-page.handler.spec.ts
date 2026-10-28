import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { DatabaseSnapshotReaderPort } from 'src/modules/database/application/ports/database-snapshot-reader.port';
import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type { PublicationAvailabilityService } from '../../../services/publication-availability.service';
import { GetPublicPageHandler } from './get-public-page.handler';
import { GetPublicPageQuery } from './get-public-page.query';

describe('GetPublicPageHandler capabilities', () => {
  const page = {
    getId: () => 'page-id',
    getTitle: () => 'About',
    getSlug: () => 'about',
    getIcon: () => null,
    getCoverUrl: () => null,
    getUpdatedAt: () => new Date('2026-10-01T00:00:00.000Z'),
  } as Page;
  const site = {
    getId: () => 'site-id',
    getSubdomain: () => 'asss',
    getAllowUpdates: () => true,
  };
  const publication = { getPath: () => '/about' };

  const createHandler = (canUpdate: boolean) => {
    const authorize = jest.fn().mockResolvedValue(canUpdate);
    const handler = new GetPublicPageHandler(
      {
        findActiveBySubdomain: jest.fn().mockResolvedValue(site),
      } as unknown as PublishedSiteRepository,
      {
        findActiveBySiteAndPath: jest.fn().mockResolvedValue(publication),
      } as unknown as PagePublicationRepository,
      {
        findByPageId: jest.fn().mockResolvedValue([]),
      } as unknown as PageBlockRepository,
      {
        resolve: jest.fn().mockResolvedValue({ page, breadcrumbs: [] }),
      } as unknown as PublicationAvailabilityService,
      { authorize } as unknown as AuthorizationService,
      {
        getDatabaseSnapshot: jest.fn().mockResolvedValue(null),
      } as unknown as DatabaseSnapshotReaderPort,
    );

    return { authorize, handler };
  };

  it('returns anonymous capabilities without checking update permission', async () => {
    const { authorize, handler } = createHandler(true);

    const result = await handler.execute(
      new GetPublicPageQuery('asss', '/about'),
    );

    expect(result.capabilities).toEqual({
      updates_enabled: true,
      authenticated: false,
      can_update: false,
    });
    expect(authorize).not.toHaveBeenCalled();
  });

  it.each([
    ['editor', true],
    ['viewer', false],
  ])(
    'returns page-specific capabilities for an authenticated %s',
    async (_role, canUpdate) => {
      const { authorize, handler } = createHandler(canUpdate);

      const result = await handler.execute(
        new GetPublicPageQuery('asss', '/about', 'user-id'),
      );

      expect(result.capabilities).toEqual({
        updates_enabled: true,
        authenticated: true,
        can_update: canUpdate,
      });
      expect(authorize).toHaveBeenCalledWith({
        userId: 'user-id',
        permissions: [PERMISSIONS.PAGE_UPDATE],
        target: { type: 'page', id: 'page-id' },
      });
    },
  );
});

describe('GetPublicPageHandler database views', () => {
  const page = {
    getId: () => 'page-id',
    getTitle: () => 'Roadmap',
    getSlug: () => null,
    getIcon: () => null,
    getCoverUrl: () => null,
    getUpdatedAt: () => new Date('2026-10-01T00:00:00.000Z'),
  } as Page;

  const viewBlock = (databaseId: string) =>
    PageBlock.restore({
      id: `block-${databaseId}`,
      pageId: 'page-id',
      parentBlockId: null,
      type: PageBlockType.DATABASE_VIEW,
      title: null,
      positionX: null,
      positionY: null,
      width: null,
      height: null,
      orderIndex: 0,
      content: null,
      styleConfig: null,
      dataConfig: { database_id: databaseId, view_id: 'view-1' },
      createdBy: 'owner',
      isOpen: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
    });

  const snapshot = (pageId: string) => ({
    database: { id: 'db', pageId, name: 'Tasks' },
    properties: [
      {
        id: 'p-name',
        databaseId: 'db',
        name: 'Name',
        type: 'TITLE',
        isDefault: true,
        isHideable: false,
        position: 'a',
        options: [],
      },
    ],
    rows: [
      {
        id: 'row-1',
        databaseId: 'db',
        values: [
          { id: 'v', rowId: 'row-1', propertyId: 'p-name', value: 'Ship it' },
        ],
      },
    ],
    views: [
      {
        id: 'view-1',
        databaseId: 'db',
        name: 'All tasks',
        type: 'TABLE',
        position: 'a',
        properties: [
          {
            id: 'vp',
            viewId: 'view-1',
            propertyId: 'p-name',
            position: 'a',
            visible: true,
            width: null,
          },
        ],
      },
    ],
  });

  const run = async (databasePageId: string) => {
    const handler = new GetPublicPageHandler(
      {
        findActiveBySubdomain: jest.fn().mockResolvedValue({
          getId: () => 'site-id',
          getSubdomain: () => 'acme',
          getAllowUpdates: () => false,
        }),
      } as unknown as PublishedSiteRepository,
      {
        findActiveBySiteAndPath: jest
          .fn()
          .mockResolvedValue({ getPath: () => '/' }),
      } as unknown as PagePublicationRepository,
      {
        findByPageId: jest.fn().mockResolvedValue([viewBlock('db')]),
      } as unknown as PageBlockRepository,
      {
        resolve: jest.fn().mockResolvedValue({ page, breadcrumbs: [] }),
      } as unknown as PublicationAvailabilityService,
      { authorize: jest.fn() } as unknown as AuthorizationService,
      {
        getDatabaseSnapshot: jest
          .fn()
          .mockResolvedValue(snapshot(databasePageId)),
      } as unknown as DatabaseSnapshotReaderPort,
    );

    return handler.execute(new GetPublicPageQuery('acme', '/'));
  };

  it('includes a read-only table for a database that lives on the published page', async () => {
    const result = await run('page-id');

    expect(result.blocks[0].data_config).toBeNull();
    expect(result.blocks[0].database).toMatchObject({
      name: 'Tasks',
      view: { name: 'All tasks', properties: [{ propertyId: 'p-name' }] },
      rows: [{ id: 'row-1', values: [{ value: 'Ship it' }] }],
    });
  });

  it('hides a linked view of a database from another page', async () => {
    const result = await run('other-page');

    expect(result.blocks[0].database).toBeNull();
  });
});
