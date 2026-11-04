import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { PERMISSIONS } from '../permissions/permission-code';
import { PageAccessPermissionPolicy } from './page-access-permission.policy';
import { PageShareLinkPermissionPolicy } from './page-share-link-permission.policy';
import { TeamspacePermissionPolicy } from './teamspace-permission.policy';
import { WorkspacePermissionPolicy } from './workspace-permission.policy';

describe('page comments', () => {
  it('lets a viewer read but only commenter and above write', () => {
    const can = (level: ResourceAccessLevel, permission: string) =>
      PageAccessPermissionPolicy.hasPermission(
        level,
        permission as typeof PERMISSIONS.PAGE_COMMENT_READ,
      );

    expect(can(ResourceAccessLevel.VIEWER, PERMISSIONS.PAGE_COMMENT_READ)).toBe(
      true,
    );
    expect(
      can(ResourceAccessLevel.VIEWER, PERMISSIONS.PAGE_COMMENT_CREATE),
    ).toBe(false);

    for (const level of [
      ResourceAccessLevel.COMMENTER,
      ResourceAccessLevel.EDITOR,
      ResourceAccessLevel.FULL_ACCESS,
    ]) {
      expect(can(level, PERMISSIONS.PAGE_COMMENT_CREATE)).toBe(true);
    }

    // Commenter writes comments but still cannot edit the page
    expect(
      can(ResourceAccessLevel.COMMENTER, PERMISSIONS.PAGE_BLOCK_UPDATE),
    ).toBe(false);
  });

  it('follows the same rule for share links', () => {
    expect(
      PageShareLinkPermissionPolicy.hasAllPermissions(
        ResourceAccessLevel.VIEWER,
        [PERMISSIONS.PAGE_COMMENT_CREATE],
      ),
    ).toBe(false);
    expect(
      PageShareLinkPermissionPolicy.hasAllPermissions(
        ResourceAccessLevel.COMMENTER,
        [PERMISSIONS.PAGE_COMMENT_READ, PERMISSIONS.PAGE_COMMENT_CREATE],
      ),
    ).toBe(true);
  });

  it('is granted to every workspace and teamspace role', () => {
    for (const role of Object.values(WorkspaceRole)) {
      expect(
        WorkspacePermissionPolicy.hasPermission(
          role,
          PERMISSIONS.PAGE_COMMENT_CREATE,
        ),
      ).toBe(true);
    }
    for (const role of Object.values(TeamspaceRole)) {
      expect(
        TeamspacePermissionPolicy.hasPermission(
          role,
          PERMISSIONS.PAGE_COMMENT_CREATE,
        ),
      ).toBe(true);
    }
  });
});
