import { PageTemplate } from 'src/modules/content/domain/aggregates/page-template/page-template.aggregate';
import { TemplateStatus, TemplateVisibility } from 'src/common/enum/template.enum';

export class PageTemplateResponseDto {
  id: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  coverUrl: string | null;
  category: string | null;
  isSystem: boolean;
  createdBy: string | null;
  status: TemplateStatus;
  visibility: TemplateVisibility;
  useCount: number;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(template: PageTemplate): PageTemplateResponseDto {
    const dto = new PageTemplateResponseDto();
    dto.id = template.getId();
    dto.workspaceId = template.getWorkspaceId();
    dto.name = template.getName();
    dto.description = template.getDescription();
    dto.icon = template.getIcon();
    dto.coverUrl = template.getCoverUrl();
    dto.category = template.getCategory();
    dto.isSystem = template.getIsSystem();
    dto.createdBy = template.getCreatedBy();
    dto.status = template.getStatus();
    dto.visibility = template.getVisibility();
    dto.useCount = template.getUseCount();
    dto.likesCount = template.getLikesCount();
    dto.createdAt = template.getCreatedAt();
    dto.updatedAt = template.getUpdatedAt();
    return dto;
  }
}
