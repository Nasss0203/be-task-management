import { TemplateCategory } from '../../../domain/aggregates/template-category/template-category.aggregate';

export class TemplateCategoryResponseDto {
  id: string;

  name: string;

  slug: string;

  description: string | null;

  is_active: boolean;

  sort_order: number;

  created_at: Date;

  updated_at: Date;

  static fromDomain(category: TemplateCategory): TemplateCategoryResponseDto {
    const dto = new TemplateCategoryResponseDto();

    dto.id = category.getId();
    dto.name = category.getName();
    dto.slug = category.getSlug();
    dto.description = category.getDescription();
    dto.is_active = category.getIsActive();
    dto.sort_order = category.getSortOrder();
    dto.created_at = category.getCreatedAt();
    dto.updated_at = category.getUpdatedAt();

    return dto;
  }
}
