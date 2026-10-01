import { SystemRole } from 'src/modules/identity/identity.types';
import type { GetPublicPageHandler } from '../../../application/queries/page-publication/get-public-page/get-public-page.handler';
import type { GetPublicSiteNavigationHandler } from '../../../application/queries/page-publication/get-public-site-navigation/get-public-site-navigation.handler';
import { PublicPageController } from './public-page.controller';

describe('PublicPageController', () => {
  it('passes an undefined user id for an anonymous public request', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const controller = new PublicPageController(
      { execute } as unknown as GetPublicPageHandler,
      {} as GetPublicSiteNavigationHandler,
    );

    await controller.getPublicPage('asss', null, '/');

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'asss',
        path: '/',
        userId: undefined,
      }),
    );
  });

  it('preserves the authenticated user id', async () => {
    const execute = jest.fn().mockResolvedValue({});
    const controller = new PublicPageController(
      { execute } as unknown as GetPublicPageHandler,
      {} as GetPublicSiteNavigationHandler,
    );

    await controller.getPublicPage(
      'asss',
      {
        id: 'editor-id',
        username: 'editor',
        email: 'editor@example.com',
        systemRole: SystemRole.USER,
      },
      '/',
    );

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'editor-id' }),
    );
  });
});
