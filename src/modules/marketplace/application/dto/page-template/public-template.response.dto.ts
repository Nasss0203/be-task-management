import type { PublicTemplateCreatorDto } from './public-template-creator';
import type { TemplateFeedbackSummaryDto } from '../template-feedback/template-feedback.response.dto';
import type { TemplateVersionResponseDto } from '../../../../template/application/dto/template-version/template-version.response.dto';
import type { ListPageTemplatesResponseDto } from '../../../../template/application/dto/page-template/list-page-templates.response.dto';
import type { PageTemplateResponseDto } from '../../../../template/application/dto/page-template/page-template.response.dto';
import type { TemplateOfferType } from '../../../domain/enums/template-offer-type.enum';
import type { TemplatePreviewMode } from '../../../domain/enums/template-preview-mode.enum';

export interface PublicTemplatePricingDto {
  offer_type: TemplateOfferType;
  price_amount: number;
  currency: 'VND';
  preview_mode: TemplatePreviewMode;
}

export interface PublicTemplateCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ListPublicTemplatesResponseDto {
  items: (ListPageTemplatesResponseDto['items'][number] &
    PublicTemplatePricingDto &
    TemplateFeedbackSummaryDto & {
      categories: PublicTemplateCategoryDto[];
      tags: string[];
      creator: PublicTemplateCreatorDto | null;
    })[];
  nextCursor: string | null;
}

export interface PublicTemplateDetailResponseDto
  extends
    PageTemplateResponseDto,
    PublicTemplatePricingDto,
    TemplateFeedbackSummaryDto {
  version: TemplateVersionResponseDto;
  categories: PublicTemplateCategoryDto[];
  tags: string[];
  creator: PublicTemplateCreatorDto | null;
}
