import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';
import { GetTeamspacesHandler } from './get-teamspaces.handler';
import { GetTeamspacesQuery } from './get-teamspaces.query';

describe('GetTeamspacesHandler', () => {
  const teamspace = (id: string) => ({
    getId: () => id,
    getWorkspaceId: () => 'workspace',
    getName: () => id,
    getSlug: () => id,
    getDescription: () => null,
    getIcon: () => null,
    getVisibility: () => TeamspaceVisibility.OPEN,
    getCreatedBy: () => 'creator',
    getCreatedAt: () => new Date(0),
    getUpdatedAt: () => new Date(0),
  });

  it("returns the caller's role in each teamspace", async () => {
    const findAccessibleByWorkspaceAndUser = jest.fn().mockResolvedValue([
      { teamspace: teamspace('owned'), myRole: TeamspaceRole.OWNER },
      { teamspace: teamspace('open'), myRole: null },
    ]);
    const handler = new GetTeamspacesHandler({
      findAccessibleByWorkspaceAndUser,
    } as never);

    const result = await handler.execute(
      new GetTeamspacesQuery('user', 'workspace'),
    );

    expect(findAccessibleByWorkspaceAndUser).toHaveBeenCalledWith(
      'workspace',
      'user',
    );
    expect(result.map(({ id, myRole }) => ({ id, myRole }))).toEqual([
      { id: 'owned', myRole: TeamspaceRole.OWNER },
      { id: 'open', myRole: null },
    ]);
  });
});
