import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { AddTeamspaceMemberCommand } from './add-teamspace-member.command';
import { AddTeamspaceMemberHandler } from './add-teamspace-member.handler';

describe('AddTeamspaceMemberHandler transactional authorization', () => {
  const context = {};
  let teamspaceRepo: any;
  let memberRepo: any;
  let workspaceMemberRepo: any;
  let lock: any;
  let uow: any;
  let authorization: any;
  let handler: AddTeamspaceMemberHandler;
  let actorRole: TeamspaceRole;

  const command = (role: TeamspaceRole) =>
    new AddTeamspaceMemberCommand('teamspace', 'target', role, 'actor-user');

  beforeEach(() => {
    actorRole = TeamspaceRole.OWNER;
    teamspaceRepo = {
      findById: jest
        .fn()
        .mockResolvedValue({ getWorkspaceId: () => 'workspace' }),
    };
    memberRepo = {
      findByTeamspaceAndWorkspaceMember: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ getRoleName: () => actorRole }),
        ),
      exists: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    workspaceMemberRepo = {
      findByWorkspaceAndUser: jest.fn().mockResolvedValue({
        getId: () => 'actor',
        getRole: () => WorkspaceRole.MEMBER,
        isGuest: () => false,
      }),
      findById: jest.fn().mockResolvedValue({
        getWorkspaceId: () => 'workspace',
        isGuest: () => false,
      }),
    };
    lock = { lockForMembershipChange: jest.fn().mockResolvedValue(undefined) };
    uow = { runInTransaction: jest.fn((fn) => fn(context)) };
    authorization = { authorize: jest.fn().mockResolvedValue(true) };
    handler = new AddTeamspaceMemberHandler(
      teamspaceRepo,
      memberRepo,
      workspaceMemberRepo,
      lock,
      uow,
      authorization,
    );
  });

  it.each([TeamspaceRole.MEMBER, TeamspaceRole.OWNER])(
    'adds %s after locking and checking actor inside the transaction',
    async (role) => {
      await handler.execute(command(role));
      expect(lock.lockForMembershipChange).toHaveBeenCalledWith(
        'target',
        'teamspace',
        'actor-user',
        context,
      );
      expect(workspaceMemberRepo.findByWorkspaceAndUser).toHaveBeenCalledWith(
        'workspace',
        'actor-user',
        context,
      );
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({}),
        context,
      );
    },
  );

  it.each([TeamspaceRole.MEMBER, TeamspaceRole.OWNER])(
    'rejects %s after the actor is demoted while waiting for the lock',
    async (role) => {
      actorRole = TeamspaceRole.MEMBER;
      await expect(handler.execute(command(role))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(memberRepo.save).not.toHaveBeenCalled();
    },
  );

  it('rejects a removed actor even if preliminary authorization passed', async () => {
    workspaceMemberRepo.findByWorkspaceAndUser.mockResolvedValue(null);
    await expect(
      handler.execute(command(TeamspaceRole.OWNER)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(memberRepo.save).not.toHaveBeenCalled();
  });

  it('uses the existing Workspace Owner policy without a Teamspace membership', async () => {
    workspaceMemberRepo.findByWorkspaceAndUser.mockResolvedValue({
      getId: () => 'actor',
      getRole: () => WorkspaceRole.OWNER,
      isGuest: () => false,
    });
    memberRepo.findByTeamspaceAndWorkspaceMember.mockResolvedValue(null);
    await expect(handler.execute(command(TeamspaceRole.OWNER))).resolves.toBeDefined();
    expect(memberRepo.save).toHaveBeenCalledTimes(1);
  });

  it('keeps target and duplicate checks inside the transaction', async () => {
    workspaceMemberRepo.findById.mockResolvedValue(null);
    await expect(
      handler.execute(command(TeamspaceRole.MEMBER)),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(memberRepo.save).not.toHaveBeenCalled();
  });

  it('does not save when the lock rejects a changed actor identity', async () => {
    lock.lockForMembershipChange.mockRejectedValue(
      new ForbiddenException('Actor workspace membership changed'),
    );
    await expect(handler.execute(command(TeamspaceRole.OWNER))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(memberRepo.save).not.toHaveBeenCalled();
  });
});
