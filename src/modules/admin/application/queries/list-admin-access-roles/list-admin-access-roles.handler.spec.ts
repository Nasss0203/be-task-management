import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { AdminAccessPolicy } from '../../../domain/policies/admin-access.policy';
import { AdminAuthorizationService } from '../../services/admin-authorization.service';
import { ListAdminAccessRolesHandler } from './list-admin-access-roles.handler';

describe('ListAdminAccessRolesHandler', () => {
  const handler = new ListAdminAccessRolesHandler(
    new AdminAuthorizationService(),
  );

  it('returns both admin roles with the permissions of the access policy', () => {
    const roles = handler.execute();

    expect(roles.map((role) => role.systemRole)).toEqual([
      SystemRole.SUPER_ADMIN,
      SystemRole.SYSTEM_ADMIN,
    ]);

    for (const role of roles) {
      expect(role.permissions).toEqual(
        AdminAccessPolicy.getRolePermissions(role.systemRole),
      );
    }
  });

  it('gives super admins every permission and system admins read access only', () => {
    const [superAdmin, systemAdmin] = handler.execute();

    expect(superAdmin.permissions).toEqual(Object.values(ADMIN_PERMISSIONS));
    expect(systemAdmin.permissions).toHaveLength(6);
    expect(systemAdmin.permissions).not.toContain(
      ADMIN_PERMISSIONS.USERS_ROLE_UPDATE,
    );
  });

  it('does not list the USER role', () => {
    expect(
      handler.execute().some((role) => role.systemRole === SystemRole.USER),
    ).toBe(false);
  });
});
