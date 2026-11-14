import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Teamspace } from 'src/modules/teamspace/domain/aggregates/teamspace/teamspace.aggregate';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { RestoreTeamspaceCommand } from './restore-teamspace.command';
import { RestoreTeamspaceHandler } from './restore-teamspace.handler';

describe('RestoreTeamspaceHandler', () => {
  let teamspace: Teamspace;
  let teamspaceRepo: {
    findArchivedManageableByUser: jest.Mock;
    save: jest.Mock;
  };
  let activities: { create: jest.Mock };
  let memberRepo: {
    findByTeamspaceAndWorkspaceMember: jest.Mock;
    save: jest.Mock;
  };
  let workspaceMemberRepo: { findByWorkspaceAndUser: jest.Mock };
  let entitlements: { assertWithinLimit: jest.Mock };
  let handler: RestoreTeamspaceHandler;

  beforeEach(() => {
    teamspace = Teamspace.create({
      workspaceId: 'workspace',
      name: 'Design',
      slug: 'design',
      createdBy: 'owner',
    });
    teamspace.markAsDeleted('owner');
    teamspaceRepo = {
      findArchivedManageableByUser: jest.fn().mockResolvedValue([teamspace]),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    activities = { create: jest.fn().mockResolvedValue(undefined) };
    entitlements = {
      assertWithinLimit: jest.fn().mockResolvedValue(undefined),
    };
    const unitOfWork = {
      runInTransaction: (work: (context: unknown) => Promise<unknown>) =>
        work('tx'),
    };
    memberRepo = {
      findByTeamspaceAndWorkspaceMember: jest.fn().mockResolvedValue(null),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    workspaceMemberRepo = {
      findByWorkspaceAndUser: jest.fn().mockResolvedValue({
        getId: () => 'wm-restorer',
        isGuest: () => false,
      }),
    };
    handler = new RestoreTeamspaceHandler(
      teamspaceRepo as never,
      activities as never,
      unitOfWork as never,
      entitlements as never,
      memberRepo as never,
      workspaceMemberRepo as never,
    );
  });

  it('checks the teamspace limit inside the transaction before restoring', async () => {
    await handler.execute(
      new RestoreTeamspaceCommand(teamspace.getId(), 'owner'),
    );

    expect(entitlements.assertWithinLimit).toHaveBeenCalledWith(
      'workspace',
      'MAX_TEAMSPACES',
      1,
      'tx',
    );
    expect(teamspaceRepo.save).toHaveBeenCalledWith(teamspace, 'tx');
  });

  it('keeps the teamspace archived when the plan limit is reached', async () => {
    entitlements.assertWithinLimit.mockRejectedValue(
      new ForbiddenException('WORKSPACE_LIMIT_EXCEEDED'),
    );

    await expect(
      handler.execute(new RestoreTeamspaceCommand(teamspace.getId(), 'owner')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(teamspace.getDeletedAt()).not.toBeNull();
    expect(teamspaceRepo.save).not.toHaveBeenCalled();
  });

  it('clears deletedAt and returns the teamspace', async () => {
    const result = await handler.execute(
      new RestoreTeamspaceCommand(teamspace.getId(), 'owner'),
    );

    expect(teamspaceRepo.findArchivedManageableByUser).toHaveBeenCalledWith(
      'owner',
      { teamspaceId: teamspace.getId() },
    );
    expect(teamspace.getDeletedAt()).toBeNull();
    expect(teamspace.getDeletedBy()).toBeNull();
    expect(result.id).toBe(teamspace.getId());
  });

  it('returns 404 when the user cannot manage the archived teamspace', async () => {
    teamspaceRepo.findArchivedManageableByUser.mockResolvedValue([]);

    await expect(
      handler.execute(new RestoreTeamspaceCommand(teamspace.getId(), 'member')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(teamspaceRepo.save).not.toHaveBeenCalled();
  });

  it('adds the restorer back as owner when they had left', async () => {
    await handler.execute(
      new RestoreTeamspaceCommand(teamspace.getId(), 'owner'),
    );

    expect(memberRepo.findByTeamspaceAndWorkspaceMember).toHaveBeenCalledWith(
      teamspace.getId(),
      'wm-restorer',
      'tx',
    );
    const [saved, context] = memberRepo.save.mock.calls[0] as [
      TeamspaceMember,
      string,
    ];
    expect(context).toBe('tx');
    expect(saved.getWorkspaceMemberId()).toBe('wm-restorer');
    expect(saved.getRoleName()).toBe(TeamspaceRole.OWNER);
  });

  it('promotes a restorer who is still a member', async () => {
    const existing = TeamspaceMember.create({
      teamspaceId: teamspace.getId(),
      workspaceMemberId: 'wm-restorer',
    });
    memberRepo.findByTeamspaceAndWorkspaceMember.mockResolvedValue(existing);

    await handler.execute(
      new RestoreTeamspaceCommand(teamspace.getId(), 'owner'),
    );

    expect(existing.getRoleName()).toBe(TeamspaceRole.OWNER);
    expect(memberRepo.save).toHaveBeenCalledWith(existing, 'tx');
  });

  it('leaves an existing owner untouched', async () => {
    memberRepo.findByTeamspaceAndWorkspaceMember.mockResolvedValue(
      TeamspaceMember.create({
        teamspaceId: teamspace.getId(),
        workspaceMemberId: 'wm-restorer',
        roleName: TeamspaceRole.OWNER,
      }),
    );

    await handler.execute(
      new RestoreTeamspaceCommand(teamspace.getId(), 'owner'),
    );

    expect(memberRepo.save).not.toHaveBeenCalled();
  });

  it('keeps the teamspace archived when the restorer left the workspace meanwhile', async () => {
    workspaceMemberRepo.findByWorkspaceAndUser.mockResolvedValue(null);

    await expect(
      handler.execute(new RestoreTeamspaceCommand(teamspace.getId(), 'owner')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(teamspace.getDeletedAt()).not.toBeNull();
    expect(teamspaceRepo.save).not.toHaveBeenCalled();
  });
});
