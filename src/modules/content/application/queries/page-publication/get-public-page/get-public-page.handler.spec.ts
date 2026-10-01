import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PagePublicationRepository } from 'src/modules/content/domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from 'src/modules/content/domain/repositories/published-site.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
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
