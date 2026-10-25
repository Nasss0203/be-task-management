import { NotFoundException } from '@nestjs/common';
import { Teamspace } from 'src/modules/teamspace/domain/aggregates/teamspace/teamspace.aggregate';
import { RestoreTeamspaceCommand } from './restore-teamspace.command';
import { RestoreTeamspaceHandler } from './restore-teamspace.handler';

describe('RestoreTeamspaceHandler', () => {
  let teamspace: Teamspace;
  let teamspaceRepo: any;
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
    handler = new RestoreTeamspaceHandler(teamspaceRepo);
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
});
