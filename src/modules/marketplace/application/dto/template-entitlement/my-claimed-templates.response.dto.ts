import type { ClaimedTemplateReadModel } from '../../../domain/repositories/claimed-template.read-model';

export class ClaimedTemplateResponseDto {
  entitlement_id: string;
  template_id: string;
  source: ClaimedTemplateReadModel['source'];
  claimed_at: Date;
  name: string | null;
  description: string | null;
  icon: string | null;
  cover_url: string | null;
  visibility: ClaimedTemplateReadModel['visibility'];
  status: ClaimedTemplateReadModel['status'];
  listing_status: ClaimedTemplateReadModel['listingStatus'];
  published_version: {
    id: string;
    template_id: string;
    version_number: number;
    status: NonNullable<ClaimedTemplateReadModel['publishedVersion']>['status'];
    published_at: Date | null;
  } | null;

  static fromReadModel(
    item: ClaimedTemplateReadModel,
  ): ClaimedTemplateResponseDto {
    const dto = new ClaimedTemplateResponseDto();
    dto.entitlement_id = item.entitlementId;
    dto.template_id = item.templateId;
    dto.source = item.source;
    dto.claimed_at = item.claimedAt;
    dto.name = item.name;
    dto.description = item.description;
    dto.icon = item.icon;
    dto.cover_url = item.coverUrl;
    dto.visibility = item.visibility;
    dto.status = item.status;
    dto.listing_status = item.listingStatus;
    dto.published_version = item.publishedVersion
      ? {
          id: item.publishedVersion.id,
          template_id: item.publishedVersion.templateId,
          version_number: item.publishedVersion.versionNumber,
          status: item.publishedVersion.status,
          published_at: item.publishedVersion.publishedAt,
        }
      : null;
    return dto;
  }
}

export class MyClaimedTemplatesResponseDto {
  items: ClaimedTemplateResponseDto[];
  nextCursor: string | null;
}
