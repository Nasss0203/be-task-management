import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { DataSource } from 'typeorm';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PageExactResolutionReader } from './page-exact-resolution.reader';

describe('PageExactResolutionReader', () => {
  const page = (
    id: string,
    title: string,
    workspaceId = 'workspace-1',
    deleted = false,
  ) =>
    ({
      getId: () => id,
      getTitle: () => title,
      getWorkspaceId: () => workspaceId,
      getDeletedAt: () => (deleted ? new Date() : null),
    }) as unknown as Page;

  it('leaves the title comparison to the scoped query, keeping only live Pages of the workspace', async () => {
    // M1: the repository compares the title in SQL.
    const findAccessibleByExactTitle = jest.fn().mockResolvedValue([
      page('one', 'Phát Hành 2.0'),
      page('two', 'Phát hành 2.0', 'workspace-2'),
      page('three', 'Phát hành 2.0', 'workspace-1', true),
    ]);
    const reader = new PageExactResolutionReader({
      findAccessibleByExactTitle,
    } as unknown as PageRepository, {} as DataSource);

    const result = await reader.findAccessibleByExactTitle(
      'user-1', 'workspace-1', ' phát hành 2.0 ',
    );
    expect(result.map((candidate) => candidate.getId())).toEqual(['one']);
    expect(findAccessibleByExactTitle).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
      ' phát hành 2.0 ',
    );
  });

  it('reads only ids and titles for sentence matching (M1b)', async () => {
    const titles = [
      { id: 'one', title: 'Phát Hành 2.0' },
      { id: 'four', title: 'Sprint Tasks' },
    ];
    const findAccessibleTitlesByWorkspace = jest.fn().mockResolvedValue(titles);
    const reader = new PageExactResolutionReader(
      {
        findAccessibleTitlesByWorkspace,
      } as unknown as PageRepository,
      {} as DataSource,
    );

    expect(
      await reader.findAccessibleTitlesInWorkspace('user-1', 'workspace-1'),
    ).toEqual(titles);
    expect(findAccessibleTitlesByWorkspace).toHaveBeenCalledWith(
      'workspace-1',
      'user-1',
    );
  });
});
