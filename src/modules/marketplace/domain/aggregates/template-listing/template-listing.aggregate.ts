import { randomUUID } from 'crypto';

import { TemplateListingStatus } from '../../enums/template-listing-status.enum';
import { TemplateOfferType } from '../../enums/template-offer-type.enum';
import { TemplatePreviewMode } from '../../enums/template-preview-mode.enum';
import { TemplateDemoConfig } from '../../value-objects/template-demo-config.vo';
import { TemplatePrice } from '../../value-objects/template-price.vo';

export const SAME_VERSION_DEMO_ERROR =
  'A paid demo that uses the released version requires a LIMITED demo_config';

export type CreateTemplateListingParams = {
  id?: string;
  templateId: string;
  offerType?: TemplateOfferType;
  price?: TemplatePrice;
  previewMode?: TemplatePreviewMode;
  demoVersionId?: string | null;
  demoConfig?: Record<string, any> | null;
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
  previewMode?: TemplatePreviewMode;
  demoVersionId?: string | null;
  demoConfig?: Record<string, any> | null;
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
    private previewMode: TemplatePreviewMode = TemplatePreviewMode.IMAGE,
    private demoVersionId: string | null = null,
    private demoConfig: Record<string, any> | null = null,
  ) {
    if (!templateId.trim()) {
      throw new Error('Template id is required');
    }

    if (!createdBy.trim()) {
      throw new Error('Created by is required');
    }

    TemplateListingAggregate.validateOfferPrice(this.offerType, this.price);

    TemplateListingAggregate.assertDemoPolicy(
      this.offerType,
      this.demoVersionId,
      this.publishedVersionId,
      // Stored rows are trusted to parse; an unreadable config simply grants nothing.
      TemplateDemoConfig.tryParse(this.demoConfig) === 'INVALID'
        ? null
        : this.demoConfig,
    );
  }

  static create(params: CreateTemplateListingParams): TemplateListingAggregate {
    const now = new Date();
    const offerType = params.offerType ?? TemplateOfferType.FREE;
    const defaultPreviewMode =
      offerType === TemplateOfferType.PAID
        ? TemplatePreviewMode.IMAGE
        : TemplatePreviewMode.INTERACTIVE;

    return new TemplateListingAggregate(
      params.id ?? randomUUID(),
      params.templateId,
      offerType,
      TemplateListingStatus.DRAFT,
      params.createdBy,
      null,
      params.createdAt ?? now,
      params.updatedAt ?? now,
      null,
      params.price ?? TemplatePrice.free(),
      params.previewMode ?? defaultPreviewMode,
      params.demoVersionId ?? null,
      params.demoConfig ?? null,
    );
  }

  static restore(
    params: RestoreTemplateListingParams,
  ): TemplateListingAggregate {
    const defaultPreviewMode =
      params.offerType === TemplateOfferType.PAID
        ? TemplatePreviewMode.IMAGE
        : TemplatePreviewMode.INTERACTIVE;

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
      params.previewMode ?? defaultPreviewMode,
      params.demoVersionId ?? null,
      params.demoConfig ?? null,
    );
  }

  /**
   * A paid demo may reuse the released version only with a LIMITED config,
   * so the full paid snapshot is never public. Throws for an invalid schema-1
   * config. Separate demo versions and FREE listings are unaffected.
   */
  static assertDemoPolicy(
    offerType: TemplateOfferType,
    demoVersionId: string | null | undefined,
    publishedVersionId: string | null | undefined,
    demoConfig: Record<string, any> | null | undefined,
  ): void {
    const config = TemplateDemoConfig.parse(demoConfig);
    if (
      offerType === TemplateOfferType.PAID &&
      demoVersionId &&
      publishedVersionId &&
      demoVersionId === publishedVersionId &&
      !config?.isLimited()
    ) {
      throw new Error(SAME_VERSION_DEMO_ERROR);
    }
  }

  static validateOfferPrice(
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

  getPreviewMode(): TemplatePreviewMode {
    return this.previewMode;
  }

  getDemoVersionId(): string | null {
    return this.demoVersionId;
  }

  getDemoConfig(): Record<string, any> | null {
    return this.demoConfig;
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

  setPreviewMode(previewMode: TemplatePreviewMode): boolean {
    if (this.previewMode === previewMode) {
      return false;
    }

    this.previewMode = previewMode;
    this.updatedAt = new Date();

    return true;
  }

  /**
   * `targetPublishedVersionId` is the release this demo will sit next to;
   * pass it when the same request also switches the released version.
   */
  setDemoPreview(
    demoVersionId?: string | null,
    demoConfig?: Record<string, any> | null,
    targetPublishedVersionId: string | null = this.publishedVersionId,
  ): boolean {
    const nextDemoVersionId = demoVersionId !== undefined ? demoVersionId : this.demoVersionId;
    const nextDemoConfig = this.resolveNextDemoConfig(
      nextDemoVersionId,
      demoConfig,
    );

    TemplateListingAggregate.assertDemoPolicy(
      this.offerType,
      nextDemoVersionId,
      targetPublishedVersionId,
      nextDemoConfig,
    );

    const isSameDemoVersion = this.demoVersionId === nextDemoVersionId;
    const isSameDemoConfig =
      JSON.stringify(this.demoConfig) === JSON.stringify(nextDemoConfig);

    if (isSameDemoVersion && isSameDemoConfig) {
      return false;
    }

    this.demoVersionId = nextDemoVersionId;
    this.demoConfig = nextDemoConfig;
    this.updatedAt = new Date();

    return true;
  }

  configureOffer(
    offerType: TemplateOfferType,
    price: TemplatePrice,
    previewMode?: TemplatePreviewMode,
    demoVersionId?: string | null,
    demoConfig?: Record<string, any> | null,
  ): boolean {
    TemplateListingAggregate.validateOfferPrice(offerType, price);

    const isSameOfferType = this.offerType === offerType;
    const isSamePrice = this.price.equals(price);

    const nextPreviewMode =
      previewMode !== undefined
        ? previewMode
        : isSameOfferType
          ? this.previewMode
          : offerType === TemplateOfferType.PAID
            ? TemplatePreviewMode.IMAGE
            : TemplatePreviewMode.INTERACTIVE;

    const isSamePreviewMode = this.previewMode === nextPreviewMode;

    const nextDemoVersionId =
      demoVersionId !== undefined ? demoVersionId : this.demoVersionId;
    const nextDemoConfig = this.resolveNextDemoConfig(
      nextDemoVersionId,
      demoConfig,
    );

    TemplateListingAggregate.assertDemoPolicy(
      offerType,
      nextDemoVersionId,
      this.publishedVersionId,
      nextDemoConfig,
    );

    const isSameDemoVersion = this.demoVersionId === nextDemoVersionId;
    const isSameDemoConfig =
      JSON.stringify(this.demoConfig) === JSON.stringify(nextDemoConfig);

    if (
      isSameOfferType &&
      isSamePrice &&
      isSamePreviewMode &&
      isSameDemoVersion &&
      isSameDemoConfig
    ) {
      return false;
    }

    this.offerType = offerType;
    this.price = price;
    this.previewMode = nextPreviewMode;
    this.demoVersionId = nextDemoVersionId;
    this.demoConfig = nextDemoConfig;
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

    TemplateListingAggregate.assertDemoPolicy(
      this.offerType,
      this.demoVersionId,
      version.getId(),
      this.demoConfig,
    );

    if (this.publishedVersionId !== version.getId()) {
      this.publishedVersionId = version.getId();
      this.updatedAt = new Date();
    }
  }

  /**
   * Config ids belong to one demo version's snapshot, so switching the demo
   * version without sending a new config clears the old one.
   */
  private resolveNextDemoConfig(
    nextDemoVersionId: string | null,
    demoConfig: Record<string, any> | null | undefined,
  ): Record<string, any> | null {
    if (demoConfig !== undefined) return demoConfig;
    return nextDemoVersionId === this.demoVersionId ? this.demoConfig : null;
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
