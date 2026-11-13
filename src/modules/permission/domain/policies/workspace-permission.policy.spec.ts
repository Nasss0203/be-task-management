import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { PageController } from 'src/modules/content/presentation/http/controllers/page.controller';
import { PERMISSIONS_KEY } from 'src/common/decorator/require-permissions.decorator';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

import { PERMISSIONS } from '../permissions/permission-code';
import { PageAccessPermissionPolicy } from './page-access-permission.policy';
import { TeamspacePermissionPolicy } from './teamspace-permission.policy';
import { WorkspacePermissionPolicy } from './workspace-permission.policy';

const memberHas = (
  permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
) => WorkspacePermissionPolicy.hasPermission(WorkspaceRole.MEMBER, permission);

describe('WorkspacePermissionPolicy', () => {
  it.each([
    PERMISSIONS.PAGE_CREATE,
    PERMISSIONS.PAGE_READ,
    PERMISSIONS.PAGE_UPDATE,
    PERMISSIONS.PAGE_DELETE,
    PERMISSIONS.PAGE_PUBLISH,
    PERMISSIONS.PAGE_SHARE_READ,
    PERMISSIONS.PAGE_SHARE_ADD,
    PERMISSIONS.PAGE_SHARE_UPDATE,
    PERMISSIONS.PAGE_SHARE_REMOVE,
    PERMISSIONS.DATABASE_DELETE,
  ])('lets a member work with shared pages: %s', (permission) => {
    expect(memberHas(permission)).toBe(true);
  });

  it.each([
    PERMISSIONS.WORKSPACE_UPDATE,
    PERMISSIONS.WORKSPACE_DELETE,
    PERMISSIONS.WORKSPACE_MEMBER_ADD,
    PERMISSIONS.WORKSPACE_MEMBER_UPDATE_ROLE,
    PERMISSIONS.WORKSPACE_MEMBER_REMOVE,
    PERMISSIONS.PAGE_PERMANENT_DELETE,
  ])('keeps %s for the owner only', (permission) => {
    expect(memberHas(permission)).toBe(false);
    expect(
      WorkspacePermissionPolicy.hasPermission(WorkspaceRole.OWNER, permission),
    ).toBe(true);
  });

  it('never grants permanent delete through a teamspace role or a page share', () => {
    for (const role of Object.values(TeamspaceRole)) {
      expect(
        TeamspacePermissionPolicy.hasPermission(
          role,
          PERMISSIONS.PAGE_PERMANENT_DELETE,
        ),
      ).toBe(false);
    }
    for (const level of Object.values(ResourceAccessLevel)) {
      expect(
        PageAccessPermissionPolicy.hasPermission(
          level,
          PERMISSIONS.PAGE_PERMANENT_DELETE,
        ),
      ).toBe(false);
    }
  });

  it('requires permanent delete to empty a page from the trash', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        Object.getOwnPropertyDescriptor(
          PageController.prototype,
          'permanentlyDeletePage',
        )?.value as object,
      ),
    ).toEqual([PERMISSIONS.PAGE_PERMANENT_DELETE]);
  });
});
