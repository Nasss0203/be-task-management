import type { TemplateVersionResponseDto } from '../../../../template/application/dto/template-version/template-version.response.dto';
import type { ListPageTemplatesResponseDto } from '../../../../template/application/dto/page-template/list-page-templates.response.dto';
import type { PageTemplateResponseDto } from '../../../../template/application/dto/page-template/page-template.response.dto';
import type { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';

export interface PublicTemplatePricingDto {
  offer_type: TemplateOfferType;
  price_amount: number;
  currency: 'VND';
}

export interface PublicTemplateCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ListPublicTemplatesResponseDto {
  items: (ListPageTemplatesResponseDto['items'][number] &
    PublicTemplatePricingDto & {
      categories: PublicTemplateCategoryDto[];
    })[];
  nextCursor: string | null;
}

export interface PublicTemplateDetailResponseDto
  extends PageTemplateResponseDto, PublicTemplatePricingDto {
  version: TemplateVersionResponseDto;
  categories: PublicTemplateCategoryDto[];
}
