import { ForbiddenException } from '@nestjs/common';
import { WorkspaceStarter } from 'src/modules/workspace/domain/enums/workspace-starter.enum';
import { CreateWorkspaceCommand } from './create-workspace.command';
import { CreateWorkspaceHandler } from './create-workspace.handler';

describe('CreateWorkspaceHandler', () => {
  const context = { transaction: true };
  const workspaceRepository = {
    existsBySlug: jest.fn().mockResolvedValue(false),
    save: jest.fn((workspace: unknown) => Promise.resolve(workspace)),
  };
  const workspaceMemberRepository = { save: jest.fn() };
  const pageProvisioning = {
    createPageShell: jest.fn(),
    createPageFromSnapshot: jest.fn(),
  };
  const uow = {
    runInTransaction: jest.fn((work: (ctx: unknown) => Promise<unknown>) =>
      work(context),
    ),
  };
  const freeWorkspaceLimit = { assertCanCreate: jest.fn() };
  const handler = new CreateWorkspaceHandler(
    workspaceRepository as never,
    workspaceMemberRepository as never,
    pageProvisioning as never,
    uow as never,
    freeWorkspaceLimit as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('checks the free workspace limit inside the transaction first', async () => {
    freeWorkspaceLimit.assertCanCreate.mockResolvedValue(undefined);

    const result = await handler.execute(
      new CreateWorkspaceCommand('user-1', 'Team'),
    );

    expect(freeWorkspaceLimit.assertCanCreate).toHaveBeenCalledWith(
      'user-1',
      context,
    );
    expect(
      freeWorkspaceLimit.assertCanCreate.mock.invocationCallOrder[0],
    ).toBeLessThan(workspaceRepository.save.mock.invocationCallOrder[0]);
    expect(result.name).toBe('Team');
  });

  it('creates the starter pages with their preset databases in the same transaction', async () => {
    freeWorkspaceLimit.assertCanCreate.mockResolvedValue(undefined);

    await handler.execute(
      new CreateWorkspaceCommand(
        'user-1',
        undefined,
        WorkspaceStarter.PROJECT_PLANNER,
      ),
    );

    const calls = pageProvisioning.createPageFromSnapshot.mock.calls as [
      { title: string; database: { name: string } | null },
      unknown,
    ][];
    expect(
      calls.map(([input, ctx]) => [input.title, input.database?.name, ctx]),
    ).toEqual([
      ['Project overview', 'Milestones', context],
      ['Tasks', 'Tasks', context],
    ]);
  });

  it('creates nothing when the limit is reached', async () => {
    freeWorkspaceLimit.assertCanCreate.mockRejectedValue(
      new ForbiddenException('limit'),
    );

    await expect(
      handler.execute(new CreateWorkspaceCommand('user-1', 'Team')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(workspaceRepository.save).not.toHaveBeenCalled();
    expect(workspaceMemberRepository.save).not.toHaveBeenCalled();
    expect(pageProvisioning.createPageShell).not.toHaveBeenCalled();
  });
});
