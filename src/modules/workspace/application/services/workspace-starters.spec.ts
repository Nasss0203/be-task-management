import { WorkspaceStarter } from 'src/modules/workspace/domain/enums/workspace-starter.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { getWorkspaceStarter } from './workspace-starters';

describe('getWorkspaceStarter', () => {
  it('returns no pages for a blank workspace', () => {
    expect(getWorkspaceStarter(WorkspaceStarter.BLANK).pages).toEqual([]);
  });

  it('defines every starter with a default workspace name', () => {
    for (const starter of Object.values(WorkspaceStarter)) {
      expect(getWorkspaceStarter(starter).defaultName).toBeTruthy();
    }
  });

  it.each([
    WorkspaceStarter.PERSONAL,
    WorkspaceStarter.TEAM_WIKI,
    WorkspaceStarter.PROJECT_PLANNER,
  ])('builds ordered blocks with unique source ids for %s', (starter) => {
    const { pages } = getWorkspaceStarter(starter);

    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      const sourceIds = page.blocks.map((block) => block.sourceId);
      expect(new Set(sourceIds).size).toBe(sourceIds.length);
      expect(page.blocks.map((block) => block.orderIndex)).toEqual(
        page.blocks.map((_, index) => index),
      );
    }
  });

  it('stores heading level and todo state where the editor reads them', () => {
    const [overview] = getWorkspaceStarter(
      WorkspaceStarter.PROJECT_PLANNER,
    ).pages;
    const header = overview.blocks.find(
      (block) => block.type === PageBlockType.HEADER,
    );
    const todo = overview.blocks.find(
      (block) => block.type === PageBlockType.TODO,
    );

    expect(header?.styleConfig).toEqual({ level: 2 });
    expect(todo?.content).toEqual({ text: 'Kickoff', checked: false });
  });
});
