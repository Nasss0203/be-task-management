import { PageTemplate } from '../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateStatus } from '../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../domain/enums/template-visibility.enum';

export class PageTemplateResponseDto {
  id: string;
  source_page_id: string | null;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  cover_url: string | null;
  created_by: string;
  status: TemplateStatus;
  visibility: TemplateVisibility;
  created_at: Date;
  updated_at: Date;

  static fromDomain(template: PageTemplate): PageTemplateResponseDto {
    const dto = new PageTemplateResponseDto();

    dto.id = template.getId();
    dto.source_page_id = template.getSourcePageId();
    dto.workspace_id = template.getWorkspaceId();
    dto.name = template.getName();
    dto.description = template.getDescription();
    dto.icon = template.getIcon();
    dto.cover_url = template.getCoverUrl();
    dto.created_by = template.getCreatedBy();
    dto.status = template.getStatus();
    dto.visibility = template.getVisibility();
    dto.created_at = template.getCreatedAt();
    dto.updated_at = template.getUpdatedAt();

    return dto;
  }
}
