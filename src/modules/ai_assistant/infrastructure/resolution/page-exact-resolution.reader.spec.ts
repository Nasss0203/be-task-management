import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PageExactResolutionReader } from './page-exact-resolution.reader';

describe('PageExactResolutionReader', () => {
  it('matches case-insensitive Vietnamese titles only within the authorized workspace', async () => {
    const page = (id: string, title: string, workspaceId = 'workspace-1', deleted = false) => ({
      getId: () => id, getTitle: () => title, getWorkspaceId: () => workspaceId,
      getDeletedAt: () => deleted ? new Date() : null,
    }) as unknown as Page;
    const findAccessibleByWorkspace = jest.fn().mockResolvedValue([
      page('one', 'Phát Hành 2.0'),
      page('two', 'Phát hành 2.0', 'workspace-2'),
      page('three', 'Phát hành 2.0', 'workspace-1', true),
      page('four', 'Sprint Tasks'),
    ]);
    const reader = new PageExactResolutionReader({
      findAccessibleByWorkspace,
    } as unknown as PageRepository);

    const result = await reader.findAccessibleByExactTitle(
      'user-1', 'workspace-1', ' phát hành 2.0 ',
    );
    expect(result.map((candidate) => candidate.getId())).toEqual(['one']);
    expect(findAccessibleByWorkspace).toHaveBeenCalledWith('workspace-1', 'user-1');
  });
});
