import { ForbiddenException } from '@nestjs/common';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { GetPrivateTeamspaceSummariesHandler } from './get-private-teamspace-summaries.handler';
import { GetPrivateTeamspaceSummariesQuery } from './get-private-teamspace-summaries.query';

describe('GetPrivateTeamspaceSummariesHandler', () => {
  let teamspaceRepo: { findPrivateSummariesNotJoined: jest.Mock };
  let workspaceMemberRepo: { findByWorkspaceAndUser: jest.Mock };
  let handler: GetPrivateTeamspaceSummariesHandler;

  const actor = (role: WorkspaceRole, guest = false) => ({
    getId: () => 'workspace-member',
    getRole: () => role,
    isGuest: () => guest,
  });

  beforeEach(() => {
    teamspaceRepo = {
      findPrivateSummariesNotJoined: jest.fn().mockResolvedValue([
        {
          teamspace: {
            getId: () => 'teamspace',
            getName: () => 'Finance',
            getIcon: () => null,
            getVisibility: () => TeamspaceVisibility.PRIVATE,
          },
          ownerNames: ['alice'],
          memberCount: 3,
        },
      ]),
    };
    workspaceMemberRepo = {
      findByWorkspaceAndUser: jest
        .fn()
        .mockResolvedValue(actor(WorkspaceRole.OWNER)),
    };
    handler = new GetPrivateTeamspaceSummariesHandler(
      teamspaceRepo as never,
      workspaceMemberRepo as never,
    );
  });

  const run = () =>
    handler.execute(new GetPrivateTeamspaceSummariesQuery('workspace', 'user'));

  it('returns only the summary fields to a workspace owner', async () => {
    await expect(run()).resolves.toEqual([
      {
        id: 'teamspace',
        name: 'Finance',
        icon: null,
        visibility: TeamspaceVisibility.PRIVATE,
        ownerNames: ['alice'],
        memberCount: 3,
      },
    ]);
    expect(teamspaceRepo.findPrivateSummariesNotJoined).toHaveBeenCalledWith(
      'workspace',
      'workspace-member',
    );
  });

  it.each([
    ['a workspace member', actor(WorkspaceRole.MEMBER)],
    ['a guest', actor(WorkspaceRole.OWNER, true)],
    ['someone outside the workspace', null],
  ])('rejects %s', async (_, member) => {
    workspaceMemberRepo.findByWorkspaceAndUser.mockResolvedValue(member);

    await expect(run()).rejects.toBeInstanceOf(ForbiddenException);
    expect(teamspaceRepo.findPrivateSummariesNotJoined).not.toHaveBeenCalled();
  });
});
