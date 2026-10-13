import { TemplateListing } from '../../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateListingStatus } from '../../../domain/enums/template-listing-status.enum';
import { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import type { TemplateListingCategoryInfo } from '../../../domain/repositories/template-listing.repository';

export interface TemplateListingCategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export class TemplateListingResponseDto {
  id: string;
  template_id: string;
  offer_type: TemplateOfferType;
  price_amount: number;
  currency: 'VND';
  status: TemplateListingStatus;
  created_by: string;
  published_at: Date | null;
  published_version_id: string | null;
  created_at: Date;
  updated_at: Date;
  category_ids: string[];
  categories: TemplateListingCategoryResponseDto[];

  static fromDomain(
    listing: TemplateListing,
    categories: TemplateListingCategoryInfo[],
  ): TemplateListingResponseDto {
    const dto = new TemplateListingResponseDto();

    dto.id = listing.getId();
    dto.template_id = listing.getTemplateId();
    dto.offer_type = listing.getOfferType();
    dto.price_amount = listing.getPrice().getAmount();
    dto.currency = listing.getPrice().getCurrency();
    dto.status = listing.getStatus();
    dto.created_by = listing.getCreatedBy();
    dto.published_at = listing.getPublishedAt();
    dto.published_version_id = listing.getPublishedVersionId();
    dto.created_at = listing.getCreatedAt();
    dto.updated_at = listing.getUpdatedAt();
    dto.categories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      is_active: category.isActive,
    }));
    dto.category_ids = dto.categories.map((category) => category.id);

    return dto;
  }
}
