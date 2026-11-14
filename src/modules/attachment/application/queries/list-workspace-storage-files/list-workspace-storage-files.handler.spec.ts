import { ListWorkspaceStorageFilesHandler } from './list-workspace-storage-files.handler';
import { ListWorkspaceStorageFilesQuery } from './list-workspace-storage-files.query';

describe('ListWorkspaceStorageFilesHandler', () => {
  const listFiles = jest.fn();
  const authorize = jest.fn();
  const handler = new ListWorkspaceStorageFilesHandler(
    { listFiles } as never,
    { authorize } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    listFiles.mockResolvedValue({ files: [{ id: 'a1' }], total: 21 });
  });

  it('shows the owner every file with default sort and page size', async () => {
    authorize.mockResolvedValue(true);

    await expect(
      handler.execute(new ListWorkspaceStorageFilesQuery('ws-1', 'owner', {})),
    ).resolves.toEqual({
      data: [{ id: 'a1' }],
      meta: { page: 1, pageSize: 20, total: 21, totalPages: 2 },
    });
    expect(listFiles).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      uploadedBy: null,
      type: undefined,
      status: undefined,
      search: undefined,
      sort: 'size_desc',
      skip: 0,
      take: 20,
    });
  });

  it('limits a member to their own uploads and passes the filters', async () => {
    authorize.mockResolvedValue(false);

    await handler.execute(
      new ListWorkspaceStorageFilesQuery('ws-1', 'user-a', {
        type: 'image',
        status: 'ORPHANED',
        search: '  report ',
        sort: 'created_desc',
        page: 2,
        pageSize: 10,
      }),
    );

    expect(listFiles).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      uploadedBy: 'user-a',
      type: 'image',
      status: 'ORPHANED',
      search: 'report',
      sort: 'created_desc',
      skip: 10,
      take: 10,
    });
  });
});
