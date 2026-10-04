import { PageTemplateResponseDto } from './page-template.response.dto';

export interface ListPageTemplatesResponseDto {
  items: PageTemplateResponseDto[];
  nextCursor: string | null;
}
