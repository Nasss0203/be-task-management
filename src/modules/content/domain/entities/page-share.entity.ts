import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PageShareStatus } from '../constants/page-share-status.constant';
import { ResourceAccessLevel } from '../constants/resource-access-level.constant';

interface CreatePageShareProps {
  pageId: string;
  userId: string;
  shareLinkId?: string | null;
  accessLevel: ResourceAccessLevel;
  status?: PageShareStatus;
  createdBy: string;
}

interface RestorePageShareProps {
  id: string;
  pageId: string;
  userId: string;
  shareLinkId: string | null;
  accessLevel: ResourceAccessLevel;
  status: PageShareStatus;
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
    private status: PageShareStatus,
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
      props.status ?? PageShareStatus.PENDING,
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
      props.status,
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

  accept(): void {
    if (this.status !== PageShareStatus.PENDING) {
      throw new ConflictException('Only pending invitations can be accepted');
    }

    this.status = PageShareStatus.ACCEPTED;
    this.updatedAt = new Date();
  }

  reject(): void {
    if (this.status !== PageShareStatus.PENDING) {
      throw new ConflictException('Only pending invitations can be rejected');
    }

    this.status = PageShareStatus.REJECTED;
    this.updatedAt = new Date();
  }

  /**
   * Cho phép Owner invite lại user đã reject.
   */
  reopenInvitation(accessLevel: ResourceAccessLevel): void {
    if (this.status !== PageShareStatus.REJECTED) {
      throw new ConflictException('Only rejected invitations can be reopened');
    }

    this.accessLevel = accessLevel;
    this.status = PageShareStatus.PENDING;
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

  getStatus(): PageShareStatus {
    return this.status;
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
