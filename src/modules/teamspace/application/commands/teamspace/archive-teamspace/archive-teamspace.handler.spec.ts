import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { Teamspace } from 'src/modules/teamspace/domain/aggregates/teamspace/teamspace.aggregate';
import { ArchiveTeamspaceCommand } from './archive-teamspace.command';
import { ArchiveTeamspaceHandler } from './archive-teamspace.handler';

describe('ArchiveTeamspaceHandler', () => {
  let teamspace: Teamspace;
  let teamspaceRepo: any;
  let authorization: any;
  let activities: { create: jest.Mock };
  let handler: ArchiveTeamspaceHandler;

  beforeEach(() => {
    teamspace = Teamspace.create({
      workspaceId: 'workspace',
      name: 'Design',
      slug: 'design',
      createdBy: 'owner',
    });
    teamspaceRepo = {
      findById: jest.fn().mockResolvedValue(teamspace),
      save: jest.fn().mockImplementation((value) => Promise.resolve(value)),
    };
    authorization = { authorize: jest.fn().mockResolvedValue(true) };
    activities = { create: jest.fn().mockResolvedValue(undefined) };
    handler = new ArchiveTeamspaceHandler(
      teamspaceRepo,
      authorization,
      activities as never,
    );
  });

  it('soft deletes the teamspace and records who archived it', async () => {
    await handler.execute(new ArchiveTeamspaceCommand('teamspace', 'owner'));

    expect(authorization.authorize).toHaveBeenCalledWith({
      userId: 'owner',
      permissions: [PERMISSIONS.TEAMSPACE_DELETE],
      target: { type: 'teamspace', id: 'teamspace' },
    });
    expect(teamspace.getDeletedAt()).toBeInstanceOf(Date);
    expect(teamspace.getDeletedBy()).toBe('owner');
    expect(teamspaceRepo.save).toHaveBeenCalledWith(teamspace);
    expect(activities.create).toHaveBeenCalledWith({
      workspaceId: 'workspace',
      entityType: ActivityEntityType.TEAMSPACE,
      entityId: teamspace.getId(),
      actorId: 'owner',
      action: ActivityAction.TEAMSPACE_ARCHIVED,
    });
  });

  it('rejects users without TEAMSPACE_DELETE', async () => {
    authorization.authorize.mockResolvedValue(false);

    await expect(
      handler.execute(new ArchiveTeamspaceCommand('teamspace', 'member')),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(teamspaceRepo.save).not.toHaveBeenCalled();
    expect(activities.create).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing or already archived teamspace', async () => {
    teamspaceRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ArchiveTeamspaceCommand('teamspace', 'owner')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(authorization.authorize).not.toHaveBeenCalled();
  });
});
