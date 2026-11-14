import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { UpdateWorkspaceMemberRoleCommand } from './update-workspace-member-role.command';
import { UpdateWorkspaceMemberRoleHandler } from './update-workspace-member-role.handler';

function member(userId: string, role: WorkspaceRole) {
  return WorkspaceMember.restore({
    id: `member-${userId}`,
    workspaceId: 'ws-1',
    userId,
    membershipType: WorkspaceMembershipType.MEMBER,
    role,
    joinedAt: new Date(),
    lastOpenedAt: null,
  });
}

describe('UpdateWorkspaceMemberRoleHandler billing contact', () => {
  let members: WorkspaceMember[];

  const repository = {
    findByWorkspaceAndUser: jest.fn((_: string, userId: string) =>
      Promise.resolve(members.find((m) => m.getUserId() === userId) ?? null),
    ),
    findByWorkspace: jest.fn(() => Promise.resolve(members)),
    save: jest.fn(() => Promise.resolve()),
  };
  const unitOfWork = {
    runInTransaction: jest.fn((work: (context: unknown) => unknown) =>
      work('tx'),
    ),
  };
  const activities = { create: jest.fn(() => Promise.resolve()) };
  const subscriptionLifecycle = {
    handleBillingContactLeft: jest.fn(() => Promise.resolve()),
  };
  const handler = new UpdateWorkspaceMemberRoleHandler(
    repository as never,
    unitOfWork as never,
    activities as never,
    subscriptionLifecycle as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    members = [
      member('actor-1', WorkspaceRole.OWNER),
      member('owner-2', WorkspaceRole.OWNER),
    ];
  });

  it('cancels at period end when an owner is demoted', async () => {
    await handler.execute(
      new UpdateWorkspaceMemberRoleCommand(
        'ws-1',
        'owner-2',
        WorkspaceRole.MEMBER,
        'actor-1',
      ),
    );

    expect(subscriptionLifecycle.handleBillingContactLeft).toHaveBeenCalledWith(
      'ws-1',
      'owner-2',
      'tx',
    );
  });

  it('leaves billing alone when a member is promoted to owner', async () => {
    members.push(member('member-3', WorkspaceRole.MEMBER));

    await handler.execute(
      new UpdateWorkspaceMemberRoleCommand(
        'ws-1',
        'member-3',
        WorkspaceRole.OWNER,
        'actor-1',
      ),
    );

    expect(
      subscriptionLifecycle.handleBillingContactLeft,
    ).not.toHaveBeenCalled();
  });
});
