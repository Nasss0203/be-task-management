import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

import { PERMISSIONS } from '../../domain/permissions/permission-code';
import { AuthorizationService } from './authorization.service';

type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

describe('AuthorizationService access from outside a teamspace', () => {
  let teamspaceId: string | null;
  let visibility: TeamspaceVisibility;
  let isWorkspaceMember: boolean;
  let workspaceRole: WorkspaceRole;
  let teamspaceRole: TeamspaceRole | null;
  let workspaceAccessLevel: ResourceAccessLevel | null;
  let sharedAccessLevel: ResourceAccessLevel | null;
  let shareLink: { authorize: jest.Mock };
  let service: AuthorizationService;

  beforeEach(() => {
    teamspaceId = 'teamspace';
    visibility = TeamspaceVisibility.OPEN;
    isWorkspaceMember = true;
    workspaceRole = WorkspaceRole.MEMBER;
    teamspaceRole = null;
    workspaceAccessLevel = ResourceAccessLevel.EDITOR;
    sharedAccessLevel = null;
    shareLink = { authorize: jest.fn().mockResolvedValue(true) };

    service = new AuthorizationService(
      {
        findMembership: jest.fn(() =>
          Promise.resolve(
            isWorkspaceMember
              ? {
                  workspaceId: 'workspace',
                  userId: 'member',
                  membershipType: WorkspaceMembershipType.MEMBER,
                  role: workspaceRole,
                }
              : null,
          ),
        ),
      },
      {
        findTeamspace: jest.fn(() =>
          Promise.resolve({
            id: 'teamspace',
            workspaceId: 'workspace',
            visibility,
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
        findPageBlockContext: jest.fn(() =>
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
      shareLink,
    );
  });

  const can = (permission: Permission, shareToken?: string) =>
    service.authorize({
      userId: 'member',
      permissions: [permission],
      target: { type: 'page', id: 'page' },
      shareToken,
    });

  describe('workspace general access', () => {
    it('lets a member outside an open teamspace only view the page', async () => {
      await expect(can(PERMISSIONS.PAGE_READ)).resolves.toBe(true);
      await expect(can(PERMISSIONS.PAGE_BLOCK_READ)).resolves.toBe(true);
      await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE)).resolves.toBe(false);
      await expect(can(PERMISSIONS.PAGE_UPDATE)).resolves.toBe(false);
      await expect(can(PERMISSIONS.PAGE_COMMENT_CREATE)).resolves.toBe(false);
    });

    it('gives nothing in a private teamspace, even with a saved setting', async () => {
      visibility = TeamspaceVisibility.PRIVATE;
      workspaceAccessLevel = ResourceAccessLevel.VIEWER;

      await expect(can(PERMISSIONS.PAGE_READ)).resolves.toBe(false);
    });

    it('keeps a teamspace page closed when workspace access is off', async () => {
      workspaceAccessLevel = null;

      await expect(can(PERMISSIONS.PAGE_READ)).resolves.toBe(false);
    });

    it('lets a member manage a shared page without any general access', async () => {
      teamspaceId = null;
      workspaceAccessLevel = null;

      await expect(can(PERMISSIONS.PAGE_UPDATE)).resolves.toBe(true);
      await expect(can(PERMISSIONS.PAGE_DELETE)).resolves.toBe(true);
      await expect(can(PERMISSIONS.PAGE_SHARE_UPDATE)).resolves.toBe(true);
    });

    it('keeps the chosen level for pages outside a teamspace', async () => {
      teamspaceId = null;

      await expect(can(PERMISSIONS.PAGE_UPDATE)).resolves.toBe(true);
    });
  });

  describe('share link', () => {
    beforeEach(() => {
      isWorkspaceMember = false;
    });

    it.each([TeamspaceVisibility.OPEN, TeamspaceVisibility.PRIVATE])(
      'lets a link only view a page in a %s teamspace',
      async (teamspaceVisibility) => {
        visibility = teamspaceVisibility;

        await expect(can(PERMISSIONS.PAGE_READ, 'token')).resolves.toBe(true);
        await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE, 'token')).resolves.toBe(
          false,
        );
      },
    );

    it('applies the same limit to page blocks', async () => {
      const block = (permission: Permission) =>
        service.authorize({
          userId: 'member',
          permissions: [permission],
          target: { type: 'pageBlock', id: 'block' },
          shareToken: 'token',
        });

      await expect(block(PERMISSIONS.PAGE_BLOCK_READ)).resolves.toBe(true);
      await expect(block(PERMISSIONS.PAGE_BLOCK_UPDATE)).resolves.toBe(false);
    });

    it('keeps an editing link on pages outside a teamspace', async () => {
      teamspaceId = null;

      await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE, 'token')).resolves.toBe(
        true,
      );
    });
  });

  describe('workspace owner inside a teamspace', () => {
    const canTeamspace = (permission: Permission) =>
      service.authorize({
        userId: 'member',
        permissions: [permission],
        target: { type: 'teamspace', id: 'teamspace' },
      });

    beforeEach(() => {
      workspaceRole = WorkspaceRole.OWNER;
    });

    it('sees nothing in a private teamspace without joining', async () => {
      visibility = TeamspaceVisibility.PRIVATE;

      await expect(canTeamspace(PERMISSIONS.TEAMSPACE_READ)).resolves.toBe(
        false,
      );
      await expect(can(PERMISSIONS.PAGE_READ)).resolves.toBe(false);
    });

    it('only views an open teamspace without joining', async () => {
      await expect(canTeamspace(PERMISSIONS.TEAMSPACE_READ)).resolves.toBe(
        true,
      );
      await expect(canTeamspace(PERMISSIONS.TEAMSPACE_UPDATE)).resolves.toBe(
        false,
      );
      await expect(
        canTeamspace(PERMISSIONS.TEAMSPACE_MEMBER_ADD),
      ).resolves.toBe(false);
    });

    it('follows the teamspace role after joining', async () => {
      teamspaceRole = TeamspaceRole.MEMBER;

      await expect(canTeamspace(PERMISSIONS.TEAMSPACE_UPDATE)).resolves.toBe(
        false,
      );

      teamspaceRole = TeamspaceRole.OWNER;

      await expect(canTeamspace(PERMISSIONS.TEAMSPACE_UPDATE)).resolves.toBe(
        true,
      );
    });
  });

  it('keeps editing for teamspace members', async () => {
    teamspaceRole = TeamspaceRole.MEMBER;

    await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE)).resolves.toBe(true);
  });

  it('keeps editing for someone the page is shared with directly', async () => {
    visibility = TeamspaceVisibility.PRIVATE;
    sharedAccessLevel = ResourceAccessLevel.EDITOR;

    await expect(can(PERMISSIONS.PAGE_BLOCK_UPDATE)).resolves.toBe(true);
  });
});
