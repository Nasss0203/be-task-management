import { TemplateVersionResponseDto } from '../template-version/template-version.response.dto';
import { PageTemplateResponseDto } from './page-template.response.dto';

export interface ListPageTemplatesResponseDto {
  items: (PageTemplateResponseDto & {
    version: TemplateVersionResponseDto | null;
  })[];
  nextCursor: string | null;
}
