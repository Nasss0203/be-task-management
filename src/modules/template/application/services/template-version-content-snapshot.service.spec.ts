import { ForbiddenException } from '@nestjs/common';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { TemplateVersionContentSnapshotService } from './template-version-content-snapshot.service';

describe('TemplateVersionContentSnapshotService database access', () => {
  const workspaceId = 'workspace-1';
  const databasePageId = 'page-with-database';
  const block = {
    sourceId: 'block-1',
    parentSourceId: null,
    type: PageBlockType.DATABASE_VIEW,
    title: null,
    positionX: null,
    positionY: null,
    width: null,
    height: null,
    orderIndex: 0,
    content: {},
    styleConfig: {},
    dataConfig: { database_id: 'database-1', view_id: 'view-1' },
    isOpen: true,
  };

  function setup(databaseWorkspaceId = workspaceId, allowed = true) {
    const pageSnapshotReader = {
      getPageSnapshot: jest.fn().mockResolvedValue({
        page: { workspaceId: databaseWorkspaceId },
        blocks: [],
      }),
    };
    const authorizationService = {
      authorize: jest.fn().mockResolvedValue(allowed),
    };
    const databaseSnapshotReader = {
      getDatabaseSnapshot: jest.fn().mockResolvedValue({
        database: { id: 'database-1', pageId: databasePageId, name: 'Tasks' },
        properties: [
          {
            id: 'property-1',
            databaseId: 'database-1',
            name: 'Name',
            type: 'TEXT',
            options: [],
          },
        ],
        rows: [{ id: 'row-1', databaseId: 'database-1', values: [] }],
        views: [
          {
            id: 'view-1',
            databaseId: 'database-1',
            name: 'Table',
            type: 'TABLE',
            properties: [],
          },
        ],
      }),
    };
    const service = new TemplateVersionContentSnapshotService(
      pageSnapshotReader as never,
      authorizationService as never,
      databaseSnapshotReader as never,
      {} as never,
      {} as never,
    );
    return {
      service,
      pageSnapshotReader,
      authorizationService,
      databaseSnapshotReader,
    };
  }

  const input = {
    blocks: [block],
    workspaceId,
    userId: 'creator',
    context: {} as never,
  };

  it('copies a valid view and its database snapshot', async () => {
    const s = setup();
    const result = await s.service.prepare(input as never);
    expect(result.databases).toHaveLength(1);
    expect(result.databases[0].rows).toHaveLength(1);
    expect(result.databases[0].views).toHaveLength(1);
    expect(s.authorizationService.authorize).toHaveBeenCalledWith({
      userId: 'creator',
      permissions: ['page.read'],
      target: { type: 'page', id: databasePageId },
    });
    const storedName = result.databases[0].database.name;
    const source =
      await s.databaseSnapshotReader.getDatabaseSnapshot.mock.results[0].value;
    source.database.name = 'Changed after snapshot';
    expect(result.databases[0].database.name).toBe(storedName);
  });

  it('rejects a database owned by a different workspace', async () => {
    const s = setup('other-workspace');
    await expect(s.service.prepare(input as never)).rejects.toThrow(
      ForbiddenException,
    );
    expect(s.authorizationService.authorize).not.toHaveBeenCalled();
  });

  it('rejects a database page without read permission', async () => {
    const s = setup(workspaceId, false);
    await expect(s.service.prepare(input as never)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects a view ID that does not belong to the database', async () => {
    const s = setup();
    const wrongView = {
      ...block,
      dataConfig: { database_id: 'database-1', view_id: 'other-view' },
    };
    await expect(
      s.service.prepare({ ...input, blocks: [wrongView] } as never),
    ).rejects.toThrow();
  });
});
