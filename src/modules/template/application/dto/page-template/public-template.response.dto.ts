import type { TemplateVersionResponseDto } from '../template-version/template-version.response.dto';
import type { ListPageTemplatesResponseDto } from './list-page-templates.response.dto';
import type { PageTemplateResponseDto } from './page-template.response.dto';

export interface PublicTemplateCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ListPublicTemplatesResponseDto {
  items: (ListPageTemplatesResponseDto['items'][number] & {
    categories: PublicTemplateCategoryDto[];
  })[];
  nextCursor: string | null;
}

export interface PublicTemplateDetailResponseDto extends PageTemplateResponseDto {
  version: TemplateVersionResponseDto;
  categories: PublicTemplateCategoryDto[];
}
