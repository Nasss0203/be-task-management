import { randomUUID } from 'crypto';
import { PageAccessRequestStatus } from '../constants/page-access-request-status.constant';

interface CreatePageAccessRequestProps {
  pageId: string;
  userId: string;
}

interface RestorePageAccessRequestProps {
  id: string;
  pageId: string;
  userId: string;
  status: PageAccessRequestStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PageAccessRequest {
  private constructor(
    private readonly id: string,
    private readonly pageId: string,
    private readonly userId: string,
    private status: PageAccessRequestStatus,
    private reviewedBy: string | null,
    private reviewedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(props: CreatePageAccessRequestProps): PageAccessRequest {
    const now = new Date();

    return new PageAccessRequest(
      randomUUID(),
      props.pageId,
      props.userId,
      PageAccessRequestStatus.PENDING,
      null,
      null,
      now,
      now,
    );
  }

  static restore(props: RestorePageAccessRequestProps): PageAccessRequest {
    return new PageAccessRequest(
      props.id,
      props.pageId,
      props.userId,
      props.status,
      props.reviewedBy,
      props.reviewedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  approve(reviewedBy: string): void {
    if (this.status !== PageAccessRequestStatus.PENDING) {
      return;
    }

    const now = new Date();

    this.status = PageAccessRequestStatus.APPROVED;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = now;
    this.updatedAt = now;
  }

  reject(reviewedBy: string): void {
    if (this.status !== PageAccessRequestStatus.PENDING) {
      return;
    }

    const now = new Date();

    this.status = PageAccessRequestStatus.REJECTED;
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

  getUserId(): string {
    return this.userId;
  }

  getStatus(): PageAccessRequestStatus {
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
