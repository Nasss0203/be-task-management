import { GetWorkspaceStorageHandler } from './get-workspace-storage.handler';
import { GetWorkspaceStorageQuery } from './get-workspace-storage.query';

describe('GetWorkspaceStorageHandler', () => {
  const usage = {
    workspace: { bytes: 300, count: 3 },
    byType: {
      image: { bytes: 100, count: 1 },
      document: { bytes: 200, count: 2 },
      other: { bytes: 0, count: 0 },
    },
    mine: { bytes: 100, count: 1 },
  };
  const getUsage = jest.fn();
  const authorize = jest.fn();
  const handler = new GetWorkspaceStorageHandler(
    { getUsage } as never,
    { authorize } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    getUsage.mockResolvedValue(usage);
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    'returns workspace usage with canManageAll=%s when owner=%s',
    async (isOwner, canManageAll) => {
      authorize.mockResolvedValue(isOwner);

      await expect(
        handler.execute(new GetWorkspaceStorageQuery('ws-1', 'user-a')),
      ).resolves.toEqual({ ...usage, canManageAll });
      expect(getUsage).toHaveBeenCalledWith('ws-1', 'user-a');
    },
  );
});
