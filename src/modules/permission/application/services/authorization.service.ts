import { Inject, Injectable } from '@nestjs/common';

import { TeamspaceRole } from 'src/modules/workspace/domain/enums/teamspace-role.enum';
import { TeamspaceVisibility } from 'src/modules/workspace/domain/enums/teamspace-visibility.enum';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';

import {
  PERMISSIONS,
  type PermissionCode,
} from '../../domain/permissions/permission-code';

import { PageSharePermissionPolicy } from '../../domain/policies/page-share-permission.policy';
import { TeamspacePermissionPolicy } from '../../domain/policies/teamspace-permission.policy';
import { WorkspacePermissionPolicy } from '../../domain/policies/workspace-permission.policy';

import { PERMISSION_TYPES } from '../../permission.types';

import type { PageGeneralAccessReader } from '../ports/page-general-access-reader.port';

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
  ) {}

  async authorize({
    userId,
    permissions,
    target,
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
        return this.authorizePage(userId, target.id, permissions);

      case 'pageBlock':
        return this.authorizePageBlock(userId, target.id, permissions);

      default: {
        const exhaustiveTarget: never = target;

        return exhaustiveTarget;
      }
    }
  }

  /**
   * Authorize Page.
   *
   * Thứ tự:
   *
   * 1. Workspace / Teamspace membership
   * 2. Direct / inherited PageShare
   * 3. General Access
   */
  private async authorizePage(
    userId: string,
    pageId: string,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const context =
      await this.resourceAuthorizationReader.findPageContext(pageId);

    if (!context) {
      return false;
    }

    /**
     * Quyền từ Workspace / Teamspace.
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
     * Không có membership phù hợp.
     *
     * Tiếp tục kiểm tra:
     *
     * - PageShare
     * - General Access
     */
    return this.authorizePageExternalAccess(
      userId,
      context.pageId,
      permissions,
    );
  }

  /**
   * Authorize PageBlock.
   *
   * PageBlock không có permission độc lập.
   * Nó kế thừa quyền từ Page chứa nó.
   */
  private async authorizePageBlock(
    userId: string,
    pageBlockId: string,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const context =
      await this.resourceAuthorizationReader.findPageBlockContext(pageBlockId);

    if (!context) {
      return false;
    }

    /**
     * Workspace / Teamspace membership.
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
     * PageBlock kế thừa PageShare
     * và General Access từ Page.
     */
    return this.authorizePageExternalAccess(
      userId,
      context.pageId,
      permissions,
    );
  }

  /**
   * Các quyền truy cập Page nằm ngoài membership.
   *
   * Dùng chung cho:
   *
   * - Page
   * - PageBlock
   *
   * Thứ tự:
   *
   * 1. PageShare
   * 2. General Access
   */
  private async authorizePageExternalAccess(
    userId: string,
    pageId: string,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const allowedByPageShare = await this.authorizePageShare(
      userId,
      pageId,
      permissions,
    );

    if (allowedByPageShare) {
      return true;
    }

    return this.authorizePageGeneralAccess(pageId, permissions);
  }

  /**
   * Kiểm tra quyền từ PageShare.
   *
   * PageSharePermissionReader chịu trách nhiệm
   * resolve direct / inherited share.
   *
   * Ví dụ:
   *
   * A → EDITOR
   * └── B
   *     └── C
   *
   * authorize C
   * → effective share = A / EDITOR
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

    return PageSharePermissionPolicy.hasAllPermissions(
      effectiveShare.accessLevel,
      permissions,
    );
  }

  /**
   * General Access.
   *
   * RESTRICTED:
   * → không cấp thêm quyền.
   *
   * LINK:
   * → cấp quyền theo linkAccessLevel.
   *
   * V1 hiện tại:
   * linkAccessLevel = VIEWER.
   */
  private async authorizePageGeneralAccess(
    pageId: string,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const setting = await this.pageGeneralAccessReader.findByPageId(pageId);

    if (!setting) {
      return false;
    }

    if (setting.generalAccess !== 'LINK') {
      return false;
    }

    return PageSharePermissionPolicy.hasAllPermissions(
      setting.linkAccessLevel,
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
     * Nếu caller biết Workspace mong đợi
     * thì Teamspace phải thuộc đúng Workspace đó.
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
     * - General Access
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
