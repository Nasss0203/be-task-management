import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

export async function resolveStorageUploaderFilter(
  authorizationService: AuthorizationService,
  workspaceId: string,
  actorId: string,
): Promise<string | null> {
  const canManageAll = await authorizationService.authorize({
    userId: actorId,
    permissions: [PERMISSIONS.WORKSPACE_UPDATE],
    target: { type: 'workspace', id: workspaceId },
  });

  return canManageAll ? null : actorId;
}
