import { randomUUID } from 'crypto';

import { ResourceAccessLevel } from '../constants/resource-access-level.constant';

interface CreatePageShareProps {
  pageId: string;
  userId: string;
  shareLinkId?: string | null;
  accessLevel: ResourceAccessLevel;
  createdBy: string;
}

interface RestorePageShareProps {
  id: string;

  pageId: string;
  userId: string;

  shareLinkId: string | null;

  accessLevel: ResourceAccessLevel;

  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

export class PageShare {
  private constructor(
    private readonly id: string,

    private readonly pageId: string,

    private readonly userId: string,

    private readonly shareLinkId: string | null,

    private accessLevel: ResourceAccessLevel,

    private readonly createdBy: string,

    private readonly createdAt: Date,

    private updatedAt: Date,
  ) {}

  static create(props: CreatePageShareProps): PageShare {
    const now = new Date();

    return new PageShare(
      randomUUID(),
      props.pageId,
      props.userId,
      props.shareLinkId ?? null,
      props.accessLevel,
      props.createdBy,
      now,
      now,
    );
  }

  static restore(props: RestorePageShareProps): PageShare {
    return new PageShare(
      props.id,

      props.pageId,

      props.userId,

      props.shareLinkId,

      props.accessLevel,

      props.createdBy,

      props.createdAt,

      props.updatedAt,
    );
  }

  changeAccessLevel(accessLevel: ResourceAccessLevel): void {
    if (this.accessLevel === accessLevel) {
      return;
    }

    this.accessLevel = accessLevel;
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  getPageId(): string {
    return this.pageId;
  }

  getUserId(): string {
    return this.userId;
  }

  getShareLinkId(): string | null {
    return this.shareLinkId;
  }

  getAccessLevel(): ResourceAccessLevel {
    return this.accessLevel;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
