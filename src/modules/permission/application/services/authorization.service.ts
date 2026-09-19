import { Inject, Injectable } from '@nestjs/common';
import { TeamspaceRole } from 'src/modules/workspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/workspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import {
  PERMISSIONS,
  type PermissionCode,
} from '../../domain/permissions/permission-code';
import { PageAccessPermissionPolicy } from '../../domain/policies/page-access-permission.policy';
import { TeamspacePermissionPolicy } from '../../domain/policies/teamspace-permission.policy';
import { WorkspacePermissionPolicy } from '../../domain/policies/workspace-permission.policy';
import { PERMISSION_TYPES } from '../../permission.types';
import type { PageGeneralAccessReader } from '../ports/page-general-access-reader.port';
import type { PageShareLinkAuthorizationReader } from '../ports/page-share-link-authorization-reader.port';
import type { PageSharePermissionReader } from '../ports/page-share-permission-reader.port';
import type {
  ResourceAuthorizationContext,
  ResourceAuthorizationReader,
} from '../ports/resource-authorization-reader.port';
import type { TeamspacePermissionReader } from '../ports/teamspace-permission-reader.port';
import type { WorkspacePermissionReader } from '../ports/workspace-permission-reader.port';
import type { AuthorizationTarget } from '../types/authorization-target';

export interface AuthorizeParams {
  userId: string;

  permissions: readonly PermissionCode[];

  target: AuthorizationTarget;

  /**
   * Token của PageShareLink nếu request hiện tại
   * đi vào thông qua Share Link.
   *
   * Optional:
   * - Direct access không cần token.
   * - Anyone with the link mới cần token.
   */
  shareToken?: string;
}

@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(PERMISSION_TYPES.ports.WorkspacePermissionReader)
    private readonly workspacePermissionReader: WorkspacePermissionReader,

    @Inject(PERMISSION_TYPES.ports.TeamspacePermissionReader)
    private readonly teamspacePermissionReader: TeamspacePermissionReader,

    @Inject(PERMISSION_TYPES.ports.ResourceAuthorizationReader)
    private readonly resourceAuthorizationReader: ResourceAuthorizationReader,

    @Inject(PERMISSION_TYPES.ports.PageSharePermissionReader)
    private readonly pageSharePermissionReader: PageSharePermissionReader,

    @Inject(PERMISSION_TYPES.ports.PageGeneralAccessReader)
    private readonly pageGeneralAccessReader: PageGeneralAccessReader,

    @Inject(PERMISSION_TYPES.ports.PageShareLinkAuthorizationReader)
    private readonly pageShareLinkAuthorizationReader: PageShareLinkAuthorizationReader,
  ) {}

  async authorize({
    userId,
    permissions,
    target,
    shareToken,
  }: AuthorizeParams): Promise<boolean> {
    switch (target.type) {
      case 'workspace':
        return this.authorizeWorkspace(userId, target.id, permissions);

      case 'teamspace':
        return this.authorizeTeamspace(
          userId,
          target.id,
          permissions,
          target.workspaceId,
        );

      case 'page':
        return this.authorizePage(userId, target.id, permissions, shareToken);

      case 'pageBlock':
        return this.authorizePageBlock(
          userId,
          target.id,
          permissions,
          shareToken,
        );

      default: {
        const exhaustiveTarget: never = target;

        return exhaustiveTarget;
      }
    }
  }

  /**
   * Authorize Page.
   *
   * Nguồn quyền thông thường:
   *
   * 1. Workspace / Teamspace membership
   * 2. Direct / inherited PageShare
   * 3. Workspace General Access
   *
   * shareToken đã được truyền xuống đây,
   * nhưng CHƯA xử lý ở bước hiện tại.
   *
   * Sau này:
   *
   * normal permission không đủ
   * + có shareToken
   * → Share Link Authorization
   */
  private async authorizePage(
    userId: string,
    pageId: string,
    permissions: readonly PermissionCode[],
    shareToken?: string,
  ): Promise<boolean> {
    const context =
      await this.resourceAuthorizationReader.findPageContext(pageId);

    if (!context) {
      return false;
    }

    /**
     * 1. Workspace / Teamspace
     */
    const allowedByMembership = await this.authorizeByContext(
      userId,
      context,
      permissions,
    );

    if (allowedByMembership) {
      return true;
    }

    /**
     * 2. PageShare / Workspace General Access
     */
    const allowedByExternalAccess = await this.authorizePageExternalAccess(
      userId,
      context,
      permissions,
    );

    if (allowedByExternalAccess) {
      return true;
    }

    /**
     * 3. Không có Share Token
     */
    if (!shareToken) {
      return false;
    }

    /**
     * 4. Anyone with the link
     */
    return this.pageShareLinkAuthorizationReader.authorize({
      token: shareToken,
      pageId: context.pageId,
      permissions,
    });
  }

  /**
   * Authorize PageBlock.
   *
   * PageBlock kế thừa quyền của Page chứa nó.
   *
   * shareToken đã được truyền xuống đây
   * nhưng CHƯA xử lý ở bước hiện tại.
   */
  private async authorizePageBlock(
    userId: string,
    pageBlockId: string,
    permissions: readonly PermissionCode[],
    shareToken?: string,
  ): Promise<boolean> {
    const context =
      await this.resourceAuthorizationReader.findPageBlockContext(pageBlockId);

    if (!context) {
      return false;
    }

    /**
     * 1. Workspace / Teamspace
     */
    const allowedByMembership = await this.authorizeByContext(
      userId,
      context,
      permissions,
    );

    if (allowedByMembership) {
      return true;
    }

    /**
     * 2. PageShare / Workspace General Access
     */
    const allowedByExternalAccess = await this.authorizePageExternalAccess(
      userId,
      context,
      permissions,
    );

    if (allowedByExternalAccess) {
      return true;
    }

    /**
     * 3. Không có Share Token
     */
    if (!shareToken) {
      return false;
    }

    /**
     * 4. PageBlock dùng quyền Share Link
     * của Page chứa nó.
     */
    return this.pageShareLinkAuthorizationReader.authorize({
      token: shareToken,
      pageId: context.pageId,
      permissions,
    });
  }
  /**
   * Các nguồn Page access ngoài role membership.
   *
   * Dùng chung cho:
   *
   * - Page
   * - PageBlock
   *
   * Nguồn hiện tại:
   *
   * 1. PageShare
   * 2. Workspace General Access
   *
   * Share Link sẽ được bổ sung sau.
   */
  private async authorizePageExternalAccess(
    userId: string,
    context: ResourceAuthorizationContext,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const allowedByPageShare = await this.authorizePageShare(
      userId,
      context.pageId,
      permissions,
    );

    if (allowedByPageShare) {
      return true;
    }

    return this.authorizePageGeneralAccess(userId, context, permissions);
  }

  /**
   * Kiểm tra quyền từ PageShare.
   *
   * PageSharePermissionReader chịu trách nhiệm
   * resolve direct / inherited PageShare.
   *
   * Ví dụ:
   *
   * A → EDITOR
   * └── B
   *     └── C
   *
   * authorize C
   * → effective share được reader resolve.
   */
  private async authorizePageShare(
    userId: string,
    pageId: string,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const effectiveShare =
      await this.pageSharePermissionReader.findEffectiveShare(pageId, userId);

    if (!effectiveShare) {
      return false;
    }

    return PageAccessPermissionPolicy.hasAllPermissions(
      effectiveShare.accessLevel,
      permissions,
    );
  }

  /**
   * General Access của Page dành cho Workspace.
   *
   * workspaceAccessLevel:
   *
   * - null:
   *   không cấp quyền thông qua Workspace General Access.
   *
   * - VIEWER / EDITOR / FULL_ACCESS:
   *   cấp quyền tương ứng cho user thuộc Workspace.
   *
   * linkAccessLevel KHÔNG được sử dụng trực tiếp ở đây.
   *
   * Link access bắt buộc phải có Share Token hợp lệ.
   */
  private async authorizePageGeneralAccess(
    userId: string,
    context: ResourceAuthorizationContext,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const setting = await this.pageGeneralAccessReader.findByPageId(
      context.pageId,
    );

    /**
     * Không có setting hoặc Workspace General Access
     * đang tắt.
     */
    if (!setting?.workspaceAccessLevel) {
      return false;
    }

    /**
     * Workspace General Access chỉ áp dụng cho
     * user thật sự thuộc Workspace.
     */
    const workspaceMembership =
      await this.workspacePermissionReader.findMembership(
        context.workspaceId,
        userId,
      );

    if (!workspaceMembership) {
      return false;
    }

    return PageAccessPermissionPolicy.hasAllPermissions(
      setting.workspaceAccessLevel,
      permissions,
    );
  }

  /**
   * Resource có Teamspace:
   * → kiểm tra Teamspace.
   *
   * Resource không có Teamspace:
   * → kiểm tra Workspace.
   */
  private async authorizeByContext(
    userId: string,
    context: ResourceAuthorizationContext,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    if (context.teamspaceId) {
      return this.authorizeTeamspace(userId, context.teamspaceId, permissions);
    }

    return this.authorizeWorkspace(userId, context.workspaceId, permissions);
  }

  /**
   * Authorize theo Workspace membership.
   */
  private async authorizeWorkspace(
    userId: string,
    workspaceId: string,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const membership = await this.workspacePermissionReader.findMembership(
      workspaceId,
      userId,
    );

    if (!membership) {
      return false;
    }

    return WorkspacePermissionPolicy.hasAllPermissions(
      membership.role,
      permissions,
    );
  }

  /**
   * Authorize theo Teamspace.
   */
  private async authorizeTeamspace(
    userId: string,
    teamspaceId: string,
    permissions: readonly PermissionCode[],
    expectedWorkspaceId?: string,
  ): Promise<boolean> {
    const teamspace =
      await this.teamspacePermissionReader.findTeamspace(teamspaceId);

    if (!teamspace) {
      return false;
    }

    /**
     * Nếu caller biết Workspace mong đợi,
     * Teamspace phải thuộc đúng Workspace đó.
     */
    if (expectedWorkspaceId && teamspace.workspaceId !== expectedWorkspaceId) {
      return false;
    }

    const workspaceMembership =
      await this.workspacePermissionReader.findMembership(
        teamspace.workspaceId,
        userId,
      );

    /**
     * Không thuộc Workspace.
     *
     * authorizePage / authorizePageBlock
     * vẫn có thể tiếp tục kiểm tra:
     *
     * - PageShare
     *
     * Workspace General Access yêu cầu
     * Workspace membership.
     *
     * Share Link sẽ được xử lý riêng
     * sau khi Share Token được verify.
     */
    if (!workspaceMembership) {
      return false;
    }

    /**
     * Workspace OWNER được xem như
     * Teamspace OWNER.
     */
    if (workspaceMembership.role === WorkspaceRole.OWNER) {
      return TeamspacePermissionPolicy.hasAllPermissions(
        TeamspaceRole.OWNER,
        permissions,
      );
    }

    const teamspaceMembership =
      await this.teamspacePermissionReader.findMembership(teamspaceId, userId);

    if (teamspaceMembership) {
      return TeamspacePermissionPolicy.hasAllPermissions(
        teamspaceMembership.role,
        permissions,
      );
    }

    /**
     * Workspace member không thuộc Teamspace,
     * nhưng Teamspace OPEN.
     *
     * Hiện tại chỉ cho đọc Teamspace.
     */
    if (teamspace.visibility === TeamspaceVisibility.OPEN) {
      return permissions.every(
        (permission) => permission === PERMISSIONS.TEAMSPACE_READ,
      );
    }

    return false;
  }
}
