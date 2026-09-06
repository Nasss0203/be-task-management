import { randomUUID } from 'crypto';

import { PageEditRequestStatus } from '../constants/page-edit-request-status.constant';

interface CreatePageEditRequestProps {
  pageId: string;
  pageShareId: string;
  userId: string;
}

interface RestorePageEditRequestProps {
  id: string;
  pageId: string;
  pageShareId: string;
  userId: string;

  status: PageEditRequestStatus;

  reviewedBy: string | null;
  reviewedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export class PageEditRequest {
  private constructor(
    private readonly id: string,

    private readonly pageId: string,

    private readonly pageShareId: string,

    private readonly userId: string,

    private status: PageEditRequestStatus,

    private reviewedBy: string | null,

    private reviewedAt: Date | null,

    private readonly createdAt: Date,

    private updatedAt: Date,
  ) {}

  static create(props: CreatePageEditRequestProps): PageEditRequest {
    const now = new Date();

    return new PageEditRequest(
      randomUUID(),
      props.pageId,
      props.pageShareId,
      props.userId,
      PageEditRequestStatus.PENDING,

      null,
      null,

      now,
      now,
    );
  }

  static restore(props: RestorePageEditRequestProps): PageEditRequest {
    return new PageEditRequest(
      props.id,
      props.pageId,
      props.pageShareId,
      props.userId,

      props.status,

      props.reviewedBy,
      props.reviewedAt,

      props.createdAt,
      props.updatedAt,
    );
  }

  approve(reviewedBy: string): void {
    if (this.status !== PageEditRequestStatus.PENDING) {
      return;
    }

    const now = new Date();

    this.status = PageEditRequestStatus.APPROVED;

    this.reviewedBy = reviewedBy;

    this.reviewedAt = now;

    this.updatedAt = now;
  }

  reject(reviewedBy: string): void {
    if (this.status !== PageEditRequestStatus.PENDING) {
      return;
    }

    const now = new Date();

    this.status = PageEditRequestStatus.REJECTED;

    this.reviewedBy = reviewedBy;

    this.reviewedAt = now;

    this.updatedAt = now;
  }

  getId(): string {
    return this.id;
  }

  getPageId(): string {
    return this.pageId;
  }

  getPageShareId(): string {
    return this.pageShareId;
  }

  getUserId(): string {
    return this.userId;
  }

  getStatus(): PageEditRequestStatus {
    return this.status;
  }

  getReviewedBy(): string | null {
    return this.reviewedBy;
  }

  getReviewedAt(): Date | null {
    return this.reviewedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
