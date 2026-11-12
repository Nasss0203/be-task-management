import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

import { PERMISSIONS } from '../../domain/permissions/permission-code';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService workspace general access', () => {
  let teamspaceId: string | null;
  let teamspaceRole: TeamspaceRole | null;
  let workspaceAccessLevel: ResourceAccessLevel | null;
  let sharedAccessLevel: ResourceAccessLevel | null;
  let service: AuthorizationService;

  beforeEach(() => {
    teamspaceId = 'teamspace';
    teamspaceRole = null;
    workspaceAccessLevel = ResourceAccessLevel.EDITOR;
    sharedAccessLevel = null;

    service = new AuthorizationService(
      {
        findMembership: jest.fn(() =>
          Promise.resolve({
            workspaceId: 'workspace',
            userId: 'member',
            membershipType: WorkspaceMembershipType.MEMBER,
            role: WorkspaceRole.MEMBER,
          }),
        ),
      },
      {
        findTeamspace: jest.fn(() =>
          Promise.resolve({
            id: 'teamspace',
            workspaceId: 'workspace',
            visibility: TeamspaceVisibility.OPEN,
          }),
        ),
        findMembership: jest.fn(() =>
          Promise.resolve(
            teamspaceRole && {
              teamspaceId: 'teamspace',
              workspaceMemberId: 'workspace-member',
              workspaceId: 'workspace',
              role: teamspaceRole,
            },
          ),
        ),
      },
      {
        findPageContext: jest.fn(() =>
          Promise.resolve({
            pageId: 'page',
            workspaceId: 'workspace',
            teamspaceId,
          }),
        ),
      } as never,
      {
        findEffectiveShare: jest.fn(() =>
          Promise.resolve(
            sharedAccessLevel && {
              shareId: 'share',
              sharedPageId: 'page',
              accessLevel: sharedAccessLevel,
            },
          ),
        ),
      },
      {
        findByPageId: jest.fn(() =>
          Promise.resolve({ workspaceAccessLevel, linkAccessLevel: null }),
        ),
      },
      { authorize: jest.fn().mockResolvedValue(false) } as never,
    );
  });

  const can = (permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) =>
    service.authorize({
      userId: 'member',
      permissions: [permission],
      target: { type: 'page', id: 'page' },
    });

  it('lets a member outside the teamspace only view a teamspace page shared with the workspace', async () => {
    await expect(can(PERMISSIONS.PAGE_READ)).resolves.toBe(true);
    await expect(can(PERMISSIONS.PAGE_BLOCK_READ)).resolves.toBe(true);
    await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE)).resolves.toBe(false);
    await expect(can(PERMISSIONS.PAGE_UPDATE)).resolves.toBe(false);
    await expect(can(PERMISSIONS.PAGE_COMMENT_CREATE)).resolves.toBe(false);
  });

  it('keeps a teamspace page closed when workspace access is off', async () => {
    workspaceAccessLevel = null;

    await expect(can(PERMISSIONS.PAGE_READ)).resolves.toBe(false);
  });

  it('keeps the chosen level for pages outside a teamspace', async () => {
    teamspaceId = null;

    await expect(can(PERMISSIONS.PAGE_UPDATE)).resolves.toBe(true);
  });

  it('keeps editing for teamspace members', async () => {
    teamspaceRole = TeamspaceRole.MEMBER;

    await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE)).resolves.toBe(true);
  });

  it('keeps editing for a member the page is shared with directly', async () => {
    sharedAccessLevel = ResourceAccessLevel.EDITOR;

    await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE)).resolves.toBe(true);
  });
});
