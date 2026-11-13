import {
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { ActivityAction } from 'src/modules/activity/domain/entities/activity.entity';
import { NotificationType } from 'src/modules/notifications/domain/entities/notification.entity';
import { Teamspace } from 'src/modules/teamspace/domain/aggregates/teamspace/teamspace.aggregate';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { LeaveTeamspaceCommand } from './leave-teamspace.command';
import {
  LeaveTeamspaceHandler,
  TEAMSPACE_OWNER_TRANSFER_REQUIRED,
} from './leave-teamspace.handler';

describe('LeaveTeamspaceHandler', () => {
  const context = 'tx';
  let teamspace: Teamspace;
  let members: TeamspaceMember[];
  let teamspaceRepo: { findById: jest.Mock; save: jest.Mock };
  let memberRepo: {
    findByTeamspaceAndWorkspaceMember: jest.Mock;
    findByTeamspaceId: jest.Mock;
    deleteById: jest.Mock;
    save: jest.Mock;
  };
  let workspaceMemberRepo: {
    findByWorkspaceAndUser: jest.Mock;
    findById: jest.Mock;
  };
  let activities: { create: jest.Mock };
  let notifications: { createNotification: jest.Mock };
  let committed: boolean;
  let handler: LeaveTeamspaceHandler;

  const member = (id: string, workspaceMemberId: string, role: TeamspaceRole) =>
    TeamspaceMember.restore({
      id,
      teamspaceId: teamspace.getId(),
      workspaceMemberId,
      roleName: role,
      joinedAt: new Date(0),
      createdAt: new Date(0),
      updatedAt: new Date(0),
    });

  const leave = (newOwnerMemberId?: string) =>
    handler.execute(
      new LeaveTeamspaceCommand(
        teamspace.getId(),
        'actor-user',
        newOwnerMemberId,
      ),
    );

  beforeEach(() => {
    teamspace = Teamspace.create({
      workspaceId: 'workspace',
      name: 'Design',
      slug: 'design',
      createdBy: 'actor-user',
    });
    members = [
      member('tm-actor', 'wm-actor', TeamspaceRole.OWNER),
      member('tm-b', 'wm-b', TeamspaceRole.MEMBER),
      member('tm-c', 'wm-c', TeamspaceRole.MEMBER),
    ];
    teamspaceRepo = {
      findById: jest.fn(() => Promise.resolve(teamspace)),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    memberRepo = {
      findByTeamspaceAndWorkspaceMember: jest.fn(() =>
        Promise.resolve(members[0]),
      ),
      findByTeamspaceId: jest.fn(() => Promise.resolve(members)),
      deleteById: jest.fn().mockResolvedValue(true),
      save: jest.fn((value) => Promise.resolve(value)),
    };
    workspaceMemberRepo = {
      findByWorkspaceAndUser: jest.fn().mockResolvedValue({
        getId: () => 'wm-actor',
        getWorkspaceId: () => 'workspace',
      }),
      findById: jest.fn((id: string) =>
        Promise.resolve({ getUserId: () => `user-of-${id}` }),
      ),
    };
    activities = { create: jest.fn().mockResolvedValue(undefined) };
    committed = false;
    notifications = {
      createNotification: jest.fn(() => {
        expect(committed).toBe(true);
        return Promise.resolve(undefined);
      }),
    };
    const uow = {
      runInTransaction: async (work: (ctx: unknown) => Promise<unknown>) => {
        const result = await work(context);
        committed = true;
        return result;
      },
    };
    handler = new LeaveTeamspaceHandler(
      teamspaceRepo as never,
      memberRepo as never,
      workspaceMemberRepo as never,
      {
        lockForMembershipChange: jest.fn().mockResolvedValue(undefined),
      } as never,
      uow as never,
      activities as never,
      notifications as never,
    );
  });

  it('asks the last owner to choose a new owner while members remain', async () => {
    const error = await leave().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as HttpException).getResponse()).toMatchObject({
      code: TEAMSPACE_OWNER_TRANSFER_REQUIRED,
    });
    expect(memberRepo.deleteById).not.toHaveBeenCalled();
    expect(memberRepo.save).not.toHaveBeenCalled();
  });

  it('hands ownership to the chosen member, then notifies them after commit', async () => {
    await leave('tm-c');

    expect(memberRepo.deleteById).toHaveBeenCalledWith('tm-actor', context);
    expect(members[2].getRoleName()).toBe(TeamspaceRole.OWNER);
    expect(members[1].getRoleName()).toBe(TeamspaceRole.MEMBER);
    expect(memberRepo.save).toHaveBeenCalledWith(members[2], context);
    expect(activities.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ActivityAction.TEAMSPACE_MEMBER_ROLE_CHANGED,
        metadata: { workspaceMemberId: 'wm-c', from: 'MEMBER', to: 'OWNER' },
      }),
      context,
    );
    expect(notifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: 'user-of-wm-c',
        type: NotificationType.TEAMSPACE_OWNERSHIP_TRANSFERRED,
        sourceId: teamspace.getId(),
      }),
    );
    expect(teamspace.getDeletedAt()).toBeNull();
  });

  it('rejects a new owner who is not in the teamspace', async () => {
    await expect(leave('tm-stranger')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(memberRepo.deleteById).not.toHaveBeenCalled();
  });

  it('archives the teamspace when its only member leaves', async () => {
    members = [members[0]];

    await leave();

    expect(memberRepo.deleteById).toHaveBeenCalledWith('tm-actor', context);
    expect(teamspace.getDeletedAt()).not.toBeNull();
    expect(teamspace.getDeletedBy()).toBe('actor-user');
    expect(teamspaceRepo.save).toHaveBeenCalledWith(teamspace, context);
    expect(activities.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: ActivityAction.TEAMSPACE_ARCHIVED }),
      context,
    );
    expect(notifications.createNotification).not.toHaveBeenCalled();
  });

  it('lets an owner leave without choosing when another owner remains', async () => {
    members[1].changeRole(TeamspaceRole.OWNER);

    await leave();

    expect(memberRepo.deleteById).toHaveBeenCalledWith('tm-actor', context);
    expect(memberRepo.save).not.toHaveBeenCalled();
    expect(teamspaceRepo.save).not.toHaveBeenCalled();
  });

  it('lets a member leave as before and ignores a new owner', async () => {
    memberRepo.findByTeamspaceAndWorkspaceMember.mockResolvedValue(members[1]);
    workspaceMemberRepo.findByWorkspaceAndUser.mockResolvedValue({
      getId: () => 'wm-b',
      getWorkspaceId: () => 'workspace',
    });

    await leave('tm-c');

    expect(memberRepo.deleteById).toHaveBeenCalledWith('tm-b', context);
    expect(members[2].getRoleName()).toBe(TeamspaceRole.MEMBER);
    expect(notifications.createNotification).not.toHaveBeenCalled();
  });

  it('keeps the leave when the notification fails', async () => {
    notifications.createNotification.mockRejectedValue(new Error('down'));

    await expect(leave('tm-b')).resolves.toBeUndefined();
    expect(memberRepo.deleteById).toHaveBeenCalled();
  });
});
