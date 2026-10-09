import { randomUUID } from 'crypto';

import { TemplateListingStatus } from '../../enums/template-listing-status.enum';
import { TemplateOfferType } from '../../enums/template-offer-type.enum';

export type CreateTemplateListingParams = {
  id?: string;
  templateId: string;
  offerType?: TemplateOfferType;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RestoreTemplateListingParams = {
  id: string;
  templateId: string;
  offerType: TemplateOfferType;
  status: TemplateListingStatus;
  createdBy: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class TemplateListingAggregate {
  private constructor(
    private readonly id: string,
    private readonly templateId: string,
    private readonly offerType: TemplateOfferType,
    private status: TemplateListingStatus,
    private readonly createdBy: string,
    private publishedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {
    if (!templateId.trim()) {
      throw new Error('Template id is required');
    }
    if (!createdBy.trim()) {
      throw new Error('Created by is required');
    }
  }

  static create(params: CreateTemplateListingParams): TemplateListingAggregate {
    const now = new Date();

    return new TemplateListingAggregate(
      params.id ?? randomUUID(),
      params.templateId,
      params.offerType ?? TemplateOfferType.FREE,
      TemplateListingStatus.DRAFT,
      params.createdBy,
      null,
      params.createdAt ?? now,
      params.updatedAt ?? now,
    );
  }

  static restore(
    params: RestoreTemplateListingParams,
  ): TemplateListingAggregate {
    return new TemplateListingAggregate(
      params.id,
      params.templateId,
      params.offerType,
      params.status,
      params.createdBy,
      params.publishedAt,
      params.createdAt,
      params.updatedAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getTemplateId(): string {
    return this.templateId;
  }

  getOfferType(): TemplateOfferType {
    return this.offerType;
  }

  getStatus(): TemplateListingStatus {
    return this.status;
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getPublishedAt(): Date | null {
    return this.publishedAt;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  isDraft(): boolean {
    return this.status === TemplateListingStatus.DRAFT;
  }

  isPublished(): boolean {
    return this.status === TemplateListingStatus.PUBLISHED;
  }

  publish(): void {
    if (this.status === TemplateListingStatus.PUBLISHED) {
      return;
    }

    this.status = TemplateListingStatus.PUBLISHED;
    this.publishedAt = new Date();
    this.updatedAt = new Date();
  }

  unpublish(): void {
    if (this.status !== TemplateListingStatus.PUBLISHED) {
      return;
    }

    this.status = TemplateListingStatus.DRAFT;
    this.publishedAt = null;
    this.updatedAt = new Date();
  }
}

export { TemplateListingAggregate as TemplateListing };
