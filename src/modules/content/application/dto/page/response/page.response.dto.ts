import { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';

export class PageResponseDto {
  id: string;
  workspace_id: string;
  title: string;
  slug: string | null;
  icon: string | null;
  cover_url: string | null;
  is_template: boolean;
  created_by: string;
  blocks?: PageBlock[]; // blocks is usually optional or lazy
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;

  static fromDomain(page: Page): PageResponseDto {
    const dto = new PageResponseDto();
    dto.id = page.getId();
    dto.workspace_id = page.getWorkspaceId();
    dto.title = page.getTitle();
    dto.slug = page.getSlug();
    dto.icon = page.getIcon();
    dto.cover_url = page.getCoverUrl();
    dto.is_template = page.getIsTemplate();
    dto.created_by = page.getCreatedBy();
    dto.createdAt = page.getCreatedAt();
    dto.updatedAt = page.getUpdatedAt();
    dto.deletedAt = page.getDeletedAt();
    dto.deletedBy = page.getDeletedBy();
    return dto;
  }
}
