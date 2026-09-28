import { randomUUID } from 'crypto';
import { PagePublicationPath } from '../value-objects/page-publication-path.vo';

type CreatePagePublicationProps = {
  id?: string;
  siteId: string;
  pageId: string;
  path: string;
  publishedBy: string;
};

type RestorePagePublicationProps = {
  id: string;
  siteId: string;
  pageId: string;
  path: string;
  publishedBy: string;
  publishedAt: Date;
  unpublishedAt: Date | null;
  updatedAt: Date;
};

export class PagePublication {
  private constructor(
    private readonly id: string,
    private readonly siteId: string,
    private readonly pageId: string,
    private path: PagePublicationPath,
    private publishedBy: string,
    private publishedAt: Date,
    private unpublishedAt: Date | null,
    private updatedAt: Date,
  ) {}

  static create(props: CreatePagePublicationProps): PagePublication {
    const now = new Date();

    return new PagePublication(
      props.id ?? randomUUID(),
      props.siteId,
      props.pageId,
      PagePublicationPath.create(props.path),
      props.publishedBy,
      now,
      null,
      now,
    );
  }

  static restore(props: RestorePagePublicationProps): PagePublication {
    return new PagePublication(
      props.id,
      props.siteId,
      props.pageId,
      PagePublicationPath.create(props.path),
      props.publishedBy,
      props.publishedAt,
      props.unpublishedAt,
      props.updatedAt,
    );
  }

  unpublish(unpublishedAt = new Date()): void {
    this.unpublishedAt = unpublishedAt;
    this.updatedAt = unpublishedAt;
  }

  republish(publishedBy: string): void {
    const now = new Date();
    this.publishedBy = publishedBy;
    this.publishedAt = now;
    this.unpublishedAt = null;
    this.updatedAt = now;
  }

  getId(): string {
    return this.id;
  }
  getSiteId(): string {
    return this.siteId;
  }
  getPageId(): string {
    return this.pageId;
  }
  getPath(): string {
    return this.path.getValue();
  }
  getPublishedBy(): string {
    return this.publishedBy;
  }
  getPublishedAt(): Date {
    return this.publishedAt;
  }
  getUnpublishedAt(): Date | null {
    return this.unpublishedAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
