import { ForbiddenException } from '@nestjs/common';
import { RestoreWorkspaceCommand } from './restore-workspace.command';
import { RestoreWorkspaceHandler } from './restore-workspace.handler';

describe('RestoreWorkspaceHandler', () => {
  const context = { transaction: true };
  const workspace = { restore: jest.fn() };
  const workspaceRepository = {
    findDeletedByUserIdAndWorkspaceId: jest.fn(),
    save: jest.fn(),
  };
  const activity = { create: jest.fn() };
  const uow = {
    runInTransaction: jest.fn((work: (ctx: unknown) => Promise<unknown>) =>
      work(context),
    ),
  };
  const freeWorkspaceLimit = { assertCanRestore: jest.fn() };
  const handler = new RestoreWorkspaceHandler(
    workspaceRepository as never,
    activity as never,
    uow as never,
    freeWorkspaceLimit as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    workspaceRepository.findDeletedByUserIdAndWorkspaceId.mockResolvedValue(
      workspace,
    );
  });

  it('keeps the workspace in the trash when the limit is reached', async () => {
    freeWorkspaceLimit.assertCanRestore.mockRejectedValue(
      new ForbiddenException('limit'),
    );

    await expect(
      handler.execute(new RestoreWorkspaceCommand('user-1', 'ws-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(freeWorkspaceLimit.assertCanRestore).toHaveBeenCalledWith(
      'user-1',
      'ws-1',
      context,
    );
    expect(workspace.restore).not.toHaveBeenCalled();
    expect(workspaceRepository.save).not.toHaveBeenCalled();
    expect(activity.create).not.toHaveBeenCalled();
  });
});
