import { PageResponseDto } from '../../../dto/page/response/page.response.dto';
import { ListPageFavoritesHandler } from './list-page-favorites.handler';
import { ListPageFavoritesQuery } from './list-page-favorites.query';

const page = (id: string) => ({
  getId: () => id,
  getWorkspaceId: () => 'workspace',
});

describe('ListPageFavoritesHandler', () => {
  it('drops favorites the user can no longer see, such as pages of an archived teamspace', async () => {
    const pageFavoriteRepo = {
      findByUserId: jest
        .fn()
        .mockResolvedValue([
          { getPageId: () => 'visible' },
          { getPageId: () => 'archived' },
        ]),
    };
    const pageRepo = {
      findById: jest.fn((id: string) => Promise.resolve(page(id))),
      findAccessibleByWorkspace: jest.fn().mockResolvedValue([page('visible')]),
    };
    const handler = new ListPageFavoritesHandler(
      pageFavoriteRepo as never,
      pageRepo as never,
    );
    jest
      .spyOn(PageResponseDto, 'fromDomain')
      .mockImplementation((value) => ({ id: value.getId() }) as never);

    const result = await handler.execute(
      new ListPageFavoritesQuery('user', 'workspace'),
    );

    expect(pageRepo.findAccessibleByWorkspace).toHaveBeenCalledWith(
      'workspace',
      'user',
    );
    expect(result).toEqual([{ id: 'visible' }]);
  });
});
