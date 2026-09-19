import type { PermissionCode } from '../../domain/permissions/permission-code';

export interface PageShareLinkAuthorizationReader {
  authorize(params: {
    token: string;
    pageId: string;
    permissions: readonly PermissionCode[];
  }): Promise<boolean>;
}
