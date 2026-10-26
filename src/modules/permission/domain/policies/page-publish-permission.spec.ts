import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { PERMISSIONS } from '../permissions/permission-code';
import { PageAccessPermissionPolicy } from './page-access-permission.policy';
import { TeamspacePermissionPolicy } from './teamspace-permission.policy';
import { WorkspacePermissionPolicy } from './workspace-permission.policy';

describe('page.publish', () => {
  it('is never granted by a page share, so guests cannot publish', () => {
    for (const level of Object.values(ResourceAccessLevel)) {
      expect(
        PageAccessPermissionPolicy.hasPermission(
          level,
          PERMISSIONS.PAGE_PUBLISH,
        ),
      ).toBe(false);
    }
  });

  it('comes with the roles that could already update pages', () => {
    expect(
      WorkspacePermissionPolicy.hasPermission(
        WorkspaceRole.OWNER,
        PERMISSIONS.PAGE_PUBLISH,
      ),
    ).toBe(true);
    for (const role of Object.values(TeamspaceRole)) {
      expect(
        TeamspacePermissionPolicy.hasPermission(role, PERMISSIONS.PAGE_PUBLISH),
      ).toBe(true);
    }
  });
});
