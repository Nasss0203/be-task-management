import { randomUUID } from 'crypto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PagePublicationType } from '../enums/page-publication-type.enum';
import { PagePublicationPath } from '../value-objects/page-publication-path.vo';

type CreatePagePublicationProps = {
  id?: string;
  siteId: string;
  pageId: string;
  path: string;
  publishedBy: string;
  parentPublicationId?: string | null;
  publicationType?: PagePublicationType;
  includeDescendants?: boolean;
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
  parentPublicationId?: string | null;
  publicationType?: PagePublicationType;
  includeDescendants?: boolean;
};

export class PagePublication {
  private static validateShape(props: CreatePagePublicationProps): void {
    const path = PagePublicationPath.create(props.path).getValue();
    const parent = props.parentPublicationId ?? null;
    const type = props.publicationType ?? PagePublicationType.DIRECT;
    if (
      (path === '/') !== (parent === null) ||
      (type === PagePublicationType.INHERITED &&
        (parent === null || props.includeDescendants === true)) ||
      (props.id !== undefined && props.id === parent)
    ) {
      throw new BadRequestException('Invalid publication root or parent shape');
    }
  }
  private constructor(
    private readonly id: string,
    private readonly siteId: string,
    private readonly pageId: string,
    private path: PagePublicationPath,
    private publishedBy: string,
    private publishedAt: Date,
    private unpublishedAt: Date | null,
    private updatedAt: Date,
    private readonly parentPublicationId: string | null,
    private readonly publicationType: PagePublicationType,
    private includeDescendants: boolean,
  ) {}

  static create(props: CreatePagePublicationProps): PagePublication {
    PagePublication.validateShape(props);
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
      props.parentPublicationId ?? null,
      props.publicationType ?? PagePublicationType.DIRECT,
      props.includeDescendants ?? false,
    );
  }

  static restore(props: RestorePagePublicationProps): PagePublication {
    PagePublication.validateShape(props);
    return new PagePublication(
      props.id,
      props.siteId,
      props.pageId,
      PagePublicationPath.create(props.path),
      props.publishedBy,
      props.publishedAt,
      props.unpublishedAt,
      props.updatedAt,
      props.parentPublicationId ?? null,
      props.publicationType ?? PagePublicationType.DIRECT,
      props.includeDescendants ?? false,
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

  updateIncludeDescendants(value: boolean): void {
    if (this.publicationType !== PagePublicationType.DIRECT)
      throw new ConflictException(
        'Inherited publication settings are managed by its publishing ancestor',
      );
    if (typeof value !== 'boolean')
      throw new BadRequestException('include_descendants must be a boolean');
    if (this.includeDescendants === value) return;
    this.includeDescendants = value;
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }
  getParentPublicationId(): string | null {
    return this.parentPublicationId;
  }
  getPublicationType(): PagePublicationType {
    return this.publicationType;
  }
  getIncludeDescendants(): boolean {
    return this.includeDescendants;
  }
  inheritsToChildren(): boolean {
    return (
      this.publicationType === PagePublicationType.INHERITED ||
      this.includeDescendants
    );
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
