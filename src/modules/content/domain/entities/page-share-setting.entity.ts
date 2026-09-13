import { randomUUID } from 'crypto';

import { ResourceAccessLevel } from '../constants/resource-access-level.constant';

interface PageShareSettingProps {
  id: string;
  pageId: string;

  /**
   * Quyền mặc định dành cho user thuộc Workspace.
   *
   * null = không cấp quyền từ Workspace general access.
   */
  workspaceAccessLevel: ResourceAccessLevel | null;

  /**
   * Quyền dành cho user truy cập thông qua link.
   *
   * null = link access đang tắt.
   */
  linkAccessLevel: ResourceAccessLevel | null;

  createdAt: Date;
  updatedAt: Date;
}

interface CreatePageShareSettingProps {
  pageId: string;
}

export class PageShareSetting {
  private constructor(private readonly props: PageShareSettingProps) {}

  static create(props: CreatePageShareSettingProps): PageShareSetting {
    const now = new Date();

    return new PageShareSetting({
      id: randomUUID(),
      pageId: props.pageId,

      // Mặc định Page là restricted.
      workspaceAccessLevel: null,
      linkAccessLevel: null,

      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: PageShareSettingProps): PageShareSetting {
    return new PageShareSetting(props);
  }

  setWorkspaceAccessLevel(accessLevel: ResourceAccessLevel | null): void {
    if (this.props.workspaceAccessLevel === accessLevel) {
      return;
    }

    this.props.workspaceAccessLevel = accessLevel;

    this.touch();
  }

  setLinkAccessLevel(accessLevel: ResourceAccessLevel | null): void {
    if (accessLevel === ResourceAccessLevel.FULL_ACCESS) {
      throw new Error('Link access cannot grant full access');
    }

    if (this.props.linkAccessLevel === accessLevel) {
      return;
    }

    this.props.linkAccessLevel = accessLevel;

    this.touch();
  }

  disableWorkspaceAccess(): void {
    this.setWorkspaceAccessLevel(null);
  }

  disableLinkAccess(): void {
    this.setLinkAccessLevel(null);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  getId(): string {
    return this.props.id;
  }

  getPageId(): string {
    return this.props.pageId;
  }

  getWorkspaceAccessLevel(): ResourceAccessLevel | null {
    return this.props.workspaceAccessLevel;
  }

  getLinkAccessLevel(): ResourceAccessLevel | null {
    return this.props.linkAccessLevel;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
