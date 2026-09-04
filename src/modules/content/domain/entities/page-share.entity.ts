import { randomUUID } from 'crypto';

import { ResourceAccessLevel } from '../constants/resource-access-level.constant';

interface CreatePageShareProps {
  pageId: string;
  userId: string;
  accessLevel: ResourceAccessLevel;
  createdBy: string;
}

interface RestorePageShareProps {
  id: string;
  pageId: string;
  userId: string;
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
    private readonly accessLevel: ResourceAccessLevel,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(props: CreatePageShareProps): PageShare {
    const now = new Date();

    return new PageShare(
      randomUUID(),
      props.pageId,
      props.userId,
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
      props.accessLevel,
      props.createdBy,
      props.createdAt,
      props.updatedAt,
    );
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
