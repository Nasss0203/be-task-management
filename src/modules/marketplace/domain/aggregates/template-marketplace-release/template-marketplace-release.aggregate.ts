import { randomUUID } from 'crypto';

import { TemplateOfferType } from '../../enums/template-offer-type.enum';

export type CreateTemplateMarketplaceReleaseParams = {
  id?: string;
  templateId: string;
  versionId: string;
  releasedAt?: Date;
  releasedBy: string | null;
  offerTypeAtRelease: TemplateOfferType;
};

export type RestoreTemplateMarketplaceReleaseParams =
  CreateTemplateMarketplaceReleaseParams & { id: string; releasedAt: Date };

export class TemplateMarketplaceReleaseAggregate {
  private constructor(
    private readonly id: string,
    private readonly templateId: string,
    private readonly versionId: string,
    private readonly releasedAt: Date,
    private readonly releasedBy: string | null,
    private readonly offerTypeAtRelease: TemplateOfferType,
  ) {
    if (typeof id !== 'string' || !id.trim())
      throw new Error('Release id is required');
    if (typeof templateId !== 'string' || !templateId.trim())
      throw new Error('Template id is required');
    if (typeof versionId !== 'string' || !versionId.trim())
      throw new Error('Version id is required');
    if (!(releasedAt instanceof Date) || !Number.isFinite(releasedAt.getTime()))
      throw new Error('Invalid release timestamp');
    if (
      releasedBy !== null &&
      (typeof releasedBy !== 'string' || !releasedBy.trim())
    )
      throw new Error('Invalid release author');
    if (
      offerTypeAtRelease !== TemplateOfferType.FREE &&
      offerTypeAtRelease !== TemplateOfferType.PAID
    )
      throw new Error('Invalid release offer type');
  }

  static create(
    params: CreateTemplateMarketplaceReleaseParams,
  ): TemplateMarketplaceReleaseAggregate {
    return new TemplateMarketplaceReleaseAggregate(
      params.id ?? randomUUID(),
      params.templateId,
      params.versionId,
      new Date(params.releasedAt ?? new Date()),
      params.releasedBy,
      params.offerTypeAtRelease,
    );
  }

  static restore(
    params: RestoreTemplateMarketplaceReleaseParams,
  ): TemplateMarketplaceReleaseAggregate {
    return new TemplateMarketplaceReleaseAggregate(
      params.id,
      params.templateId,
      params.versionId,
      new Date(params.releasedAt),
      params.releasedBy,
      params.offerTypeAtRelease,
    );
  }

  getId(): string {
    return this.id;
  }
  getTemplateId(): string {
    return this.templateId;
  }
  getVersionId(): string {
    return this.versionId;
  }
  getReleasedAt(): Date {
    return new Date(this.releasedAt);
  }
  getReleasedBy(): string | null {
    return this.releasedBy;
  }
  getOfferTypeAtRelease(): TemplateOfferType {
    return this.offerTypeAtRelease;
  }
}

export { TemplateMarketplaceReleaseAggregate as TemplateMarketplaceRelease };
