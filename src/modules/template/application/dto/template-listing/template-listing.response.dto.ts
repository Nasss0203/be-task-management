import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingStatus } from '../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';

export class TemplateListingResponseDto {
  id: string;
  template_id: string;
  offer_type: TemplateOfferType;
  status: TemplateListingStatus;
  created_by: string;
  published_at: Date | null;
  published_version_id: string | null;
  created_at: Date;
  updated_at: Date;

  static fromDomain(listing: TemplateListing): TemplateListingResponseDto {
    const dto = new TemplateListingResponseDto();

    dto.id = listing.getId();
    dto.template_id = listing.getTemplateId();
    dto.offer_type = listing.getOfferType();
    dto.status = listing.getStatus();
    dto.created_by = listing.getCreatedBy();
    dto.published_at = listing.getPublishedAt();
    dto.published_version_id = listing.getPublishedVersionId();
    dto.created_at = listing.getCreatedAt();
    dto.updated_at = listing.getUpdatedAt();

    return dto;
  }
}
