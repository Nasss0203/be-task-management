import { randomUUID } from 'crypto';

import { TemplateListingStatus } from '../../enums/template-listing-status.enum';
import { TemplateOfferType } from '../../enums/template-offer-type.enum';
import { TemplatePrice } from '../../value-objects/template-price.vo';

export type CreateTemplateListingParams = {
  id?: string;
  templateId: string;
  offerType?: TemplateOfferType;
  price?: TemplatePrice;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RestoreTemplateListingParams = {
  id: string;
  templateId: string;
  offerType: TemplateOfferType;
  status: TemplateListingStatus;
  price?: TemplatePrice;
  createdBy: string;
  publishedVersionId?: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class TemplateListingAggregate {
  private constructor(
    private readonly id: string,
    private readonly templateId: string,
    private offerType: TemplateOfferType,
    private status: TemplateListingStatus,
    private readonly createdBy: string,
    private publishedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private publishedVersionId: string | null = null,
    private price: TemplatePrice = TemplatePrice.free(),
  ) {
    if (!templateId.trim()) {
      throw new Error('Template id is required');
    }

    if (!createdBy.trim()) {
      throw new Error('Created by is required');
    }

    TemplateListingAggregate.validateOfferPrice(this.offerType, this.price);
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
      null,
      params.price ?? TemplatePrice.free(),
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
      params.publishedVersionId ?? null,
      params.price ?? TemplatePrice.free(),
    );
  }

  private static validateOfferPrice(
    offerType: TemplateOfferType,
    price: TemplatePrice,
  ): void {
    if (offerType === TemplateOfferType.FREE) {
      if (!price.isZero()) {
        throw new Error('Free template must have zero price');
      }

      return;
    }

    if (offerType === TemplateOfferType.PAID) {
      if (price.isZero()) {
        throw new Error('Paid template must have a positive price');
      }

      return;
    }

    throw new Error('Unsupported template offer type');
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

  getPrice(): TemplatePrice {
    return this.price;
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

  getPublishedVersionId(): string | null {
    return this.publishedVersionId;
  }

  isDraft(): boolean {
    return this.status === TemplateListingStatus.DRAFT;
  }

  isPublished(): boolean {
    return this.status === TemplateListingStatus.PUBLISHED;
  }

  configureOffer(offerType: TemplateOfferType, price: TemplatePrice): boolean {
    TemplateListingAggregate.validateOfferPrice(offerType, price);

    const isSameOfferType = this.offerType === offerType;
    const isSamePrice = this.price.equals(price);

    if (isSameOfferType && isSamePrice) {
      return false;
    }

    this.offerType = offerType;
    this.price = price;
    this.updatedAt = new Date();

    return true;
  }

  selectPublishedVersion(version: {
    getId(): string;
    getTemplateId(): string;
    isDraft(): boolean;
  }): void {
    if (version.getTemplateId() !== this.templateId || version.isDraft()) {
      throw new Error(
        'Listing requires a published version of the same template',
      );
    }

    if (this.publishedVersionId !== version.getId()) {
      this.publishedVersionId = version.getId();
      this.updatedAt = new Date();
    }
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
