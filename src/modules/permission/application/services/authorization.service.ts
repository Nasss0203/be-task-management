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
   * Ưu tiên:
   * 1. Workspace / Teamspace membership
   * 2. PageShare
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

    const allowedByMembership = await this.authorizeByContext(
      userId,
      context,
      permissions,
    );

    if (allowedByMembership) {
      return true;
    }

    return this.authorizePageShare(userId, context.pageId, permissions);
  }

  /**
   * Authorize PageBlock.
   *
   * PageBlock kế thừa quyền từ Page chứa nó.
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

    const allowedByMembership = await this.authorizeByContext(
      userId,
      context,
      permissions,
    );

    if (allowedByMembership) {
      return true;
    }

    return this.authorizePageShare(userId, context.pageId, permissions);
  }

  /**
   * Kiểm tra quyền theo PageShare.
   *
   * VIEWER / COMMENTER / EDITOR
   */
  private async authorizePageShare(
    userId: string,
    pageId: string,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    const accessLevel = await this.pageSharePermissionReader.findAccessLevel(
      pageId,
      userId,
    );

    if (!accessLevel) {
      return false;
    }

    return PageSharePermissionPolicy.hasAllPermissions(
      accessLevel,
      permissions,
    );
  }

  /**
   * Resource nằm trong Teamspace
   * → check Teamspace.
   *
   * Resource không nằm trong Teamspace
   * → check Workspace.
   */
  private async authorizeByContext(
    userId: string,
    context: ResourceAuthorizationContext,
    permissions: readonly PermissionCode[],
  ): Promise<boolean> {
    return context.teamspaceId
      ? this.authorizeTeamspace(userId, context.teamspaceId, permissions)
      : this.authorizeWorkspace(userId, context.workspaceId, permissions);
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

    return membership
      ? WorkspacePermissionPolicy.hasAllPermissions(
          membership.role,
          permissions,
        )
      : false;
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
     * PageShare sẽ được check ở authorizePage()
     * hoặc authorizePageBlock().
     */
    if (!workspaceMembership) {
      return false;
    }

    /**
     * Workspace OWNER được xem như Teamspace OWNER.
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
     * Workspace member không thuộc Teamspace
     * nhưng Teamspace OPEN.
     *
     * Hiện tại chỉ cho TEAMSPACE_READ.
     */
    if (teamspace.visibility === TeamspaceVisibility.OPEN) {
      return permissions.every(
        (permission) => permission === PERMISSIONS.TEAMSPACE_READ,
      );
    }

    return false;
  }
}
