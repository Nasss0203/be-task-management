import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { UpdateTeamspaceMemberRoleCommand } from './update-teamspace-member-role.command';
import { UpdateTeamspaceMemberRoleHandler } from './update-teamspace-member-role.handler';

const member = (
  id: string,
  roleName: TeamspaceRole,
  teamspaceId = 'teamspace',
) =>
  TeamspaceMember.restore({
    id,
    teamspaceId,
    workspaceMemberId: id,
    roleName,
    joinedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

describe('UpdateTeamspaceMemberRoleHandler', () => {
  const context = {};
  const command = (role: TeamspaceRole) =>
    new UpdateTeamspaceMemberRoleCommand(
      'teamspace',
      'target',
      role,
      'actor-user',
    );
  let teamspaceRepo: any;
  let memberRepo: any;
  let workspaceMemberRepo: any;
  let lock: any;
  let uow: any;
  let authorization: any;
  let handler: UpdateTeamspaceMemberRoleHandler;
  let target: TeamspaceMember;

  beforeEach(() => {
    target = member('target', TeamspaceRole.MEMBER);
    teamspaceRepo = {
      findById: jest
        .fn()
        .mockResolvedValue({ getWorkspaceId: () => 'workspace' }),
    };
    memberRepo = {
      findById: jest.fn().mockImplementation(() => Promise.resolve(target)),
      findByTeamspaceAndWorkspaceMember: jest
        .fn()
        .mockResolvedValue(member('actor', TeamspaceRole.OWNER)),
      findByTeamspaceId: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve([target, member('actor', TeamspaceRole.OWNER)]),
        ),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    workspaceMemberRepo = {
      findByWorkspaceAndUser: jest.fn().mockResolvedValue({
        getId: () => 'actor',
        getRole: () => WorkspaceRole.MEMBER,
        isGuest: () => false,
      }),
    };
    lock = { lockForMembershipChange: jest.fn().mockResolvedValue(undefined) };
    uow = { runInTransaction: jest.fn((fn) => fn(context)) };
    authorization = { authorize: jest.fn().mockResolvedValue(true) };
    handler = new UpdateTeamspaceMemberRoleHandler(
      teamspaceRepo,
      memberRepo,
      workspaceMemberRepo,
      lock,
      uow,
      authorization,
    );
  });

  it('promotes a member after locking and rechecking the actor in the transaction', async () => {
    const result = await handler.execute(command(TeamspaceRole.OWNER));
    expect(result.getRoleName()).toBe(TeamspaceRole.OWNER);
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
    expect(memberRepo.save).toHaveBeenCalledWith(target, context);
  });

  it('demotes another owner when one remains', async () => {
    target = member('target', TeamspaceRole.OWNER);
    await expect(handler.execute(command(TeamspaceRole.MEMBER))).resolves.toBe(
      target,
    );
    expect(memberRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rejects demoting the last owner', async () => {
    target = member('target', TeamspaceRole.OWNER);
    memberRepo.findByTeamspaceId.mockResolvedValue([target]);
    await expect(
      handler.execute(command(TeamspaceRole.MEMBER)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(memberRepo.save).not.toHaveBeenCalled();
  });

  it('rejects a member even when the preliminary authorization was stale', async () => {
    memberRepo.findByTeamspaceAndWorkspaceMember.mockResolvedValue(
      member('actor', TeamspaceRole.MEMBER),
    );
    await expect(
      handler.execute(command(TeamspaceRole.OWNER)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing or foreign members', async () => {
    memberRepo.findById.mockResolvedValueOnce(null);
    await expect(
      handler.execute(command(TeamspaceRole.OWNER)),
    ).rejects.toBeInstanceOf(NotFoundException);
    memberRepo.findById.mockResolvedValueOnce(
      member('target', TeamspaceRole.MEMBER, 'other'),
    );
    await expect(
      handler.execute(command(TeamspaceRole.OWNER)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid roles before opening a transaction', async () => {
    await expect(
      handler.execute(command('INVALID' as TeamspaceRole)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(uow.runInTransaction).not.toHaveBeenCalled();
  });

  it('leaves the timestamp unchanged for the same role', async () => {
    const before = target.getUpdatedAt();
    await handler.execute(command(TeamspaceRole.MEMBER));
    expect(target.getUpdatedAt()).toBe(before);
    expect(memberRepo.save).not.toHaveBeenCalled();
  });

  it('propagates persistence errors so UnitOfWork can roll back', async () => {
    memberRepo.save.mockRejectedValue(new Error('write failed'));
    await expect(handler.execute(command(TeamspaceRole.OWNER))).rejects.toThrow(
      'write failed',
    );
  });
});
