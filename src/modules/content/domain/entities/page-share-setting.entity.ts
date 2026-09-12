import { randomUUID } from 'crypto';

import { PageGeneralAccess } from '../constants/page-general-access.constant';
import { ResourceAccessLevel } from '../constants/resource-access-level.constant';

interface PageShareSettingProps {
  id: string;

  pageId: string;

  generalAccess: PageGeneralAccess;

  linkAccessLevel: ResourceAccessLevel;

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

      generalAccess: PageGeneralAccess.RESTRICTED,

      /**
       * V1:
       * Anyone with the link chỉ được VIEWER.
       */
      linkAccessLevel: ResourceAccessLevel.VIEWER,

      createdAt: now,

      updatedAt: now,
    });
  }

  static restore(props: PageShareSettingProps): PageShareSetting {
    return new PageShareSetting(props);
  }

  enableLinkAccess(): void {
    this.props.generalAccess = PageGeneralAccess.LINK;

    this.props.linkAccessLevel = ResourceAccessLevel.VIEWER;

    this.touch();
  }

  restrict(): void {
    this.props.generalAccess = PageGeneralAccess.RESTRICTED;

    this.touch();
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

  getGeneralAccess(): PageGeneralAccess {
    return this.props.generalAccess;
  }

  getLinkAccessLevel(): ResourceAccessLevel {
    return this.props.linkAccessLevel;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }
}
