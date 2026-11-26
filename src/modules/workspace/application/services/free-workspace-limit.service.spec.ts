import { HttpException } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { FreeWorkspaceLimitService } from './free-workspace-limit.service';

describe('FreeWorkspaceLimitService', () => {
  const context = { transaction: true };
  const plans: Record<string, string> = {};
  const workspaceRepository = {
    lockOwnership: jest.fn().mockResolvedValue(undefined),
    findOwnedWorkspaceIds: jest.fn<Promise<string[]>, [string, unknown]>(),
  };
  const entitlements = {
    getEntitlements: jest.fn((workspaceId: string) =>
      Promise.resolve({ plan: { code: plans[workspaceId] ?? 'FREE' } }),
    ),
  };
  const service = new FreeWorkspaceLimitService(
    workspaceRepository as never,
    entitlements as never,
  );

  const owns = (...workspaces: [string, string][]) => {
    workspaces.forEach(([id, code]) => (plans[id] = code));
    workspaceRepository.findOwnedWorkspaceIds.mockResolvedValue(
      workspaces.map(([id]) => id),
    );
  };

  const limitError = async (promise: Promise<void>) => {
    const error = await promise.then(
      () => null,
      (reason: unknown) => reason,
    );
    expect(error).toBeInstanceOf(HttpException);
    const exception = error as HttpException;
    return { status: exception.getStatus(), body: exception.getResponse() };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(plans).forEach((key) => delete plans[key]);
  });

  it('lets a user with two free workspaces create a third', async () => {
    owns(['w1', 'FREE'], ['w2', 'FREE']);

    await expect(service.assertCanCreate('u1', context)).resolves.toBe(
      undefined,
    );
    expect(workspaceRepository.lockOwnership).toHaveBeenCalledWith(
      'u1',
      context,
    );
    expect(workspaceRepository.findOwnedWorkspaceIds).toHaveBeenCalledWith(
      'u1',
      context,
    );
  });

  it('blocks a fourth free workspace with the plan limit error', async () => {
    owns(['w1', 'FREE'], ['w2', 'FREE'], ['w3', 'FREE']);

    expect(await limitError(service.assertCanCreate('u1', context))).toEqual({
      status: 403,
      body: {
        code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
        message: 'Free workspace limit reached',
        details: { feature: 'MAX_FREE_WORKSPACES', limit: 3, usage: 3 },
      },
    });
  });

  it('does not count workspaces on a paid plan', async () => {
    owns(['w1', 'FREE'], ['w2', 'PLUS'], ['w3', 'FREE']);

    await expect(service.assertCanCreate('u1', context)).resolves.toBe(
      undefined,
    );
  });

  it('blocks restoring a free workspace when the user is at the limit', async () => {
    owns(['w1', 'FREE'], ['w2', 'FREE'], ['w3', 'FREE']);

    const { status } = await limitError(
      service.assertCanRestore('u1', 'trashed', context),
    );
    expect(status).toBe(403);
  });

  it('restores a paid workspace even at the limit', async () => {
    owns(['w1', 'FREE'], ['w2', 'FREE'], ['w3', 'FREE']);
    plans.trashed = 'BUSINESS';

    await expect(
      service.assertCanRestore('u1', 'trashed', context),
    ).resolves.toBe(undefined);
    expect(workspaceRepository.findOwnedWorkspaceIds).not.toHaveBeenCalled();
  });
});
