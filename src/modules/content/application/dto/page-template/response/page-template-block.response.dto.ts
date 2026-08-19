import { PageTemplateBlock } from 'src/modules/content/domain/entities/page-template-block.entity';

export class PageTemplateBlockResponseDto {
  id: string;
  templateId: string;
  parentBlockId: string | null;
  type: string;
  content: Record<string, unknown> | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;

  static fromDomain(block: PageTemplateBlock): PageTemplateBlockResponseDto {
    const dto = new PageTemplateBlockResponseDto();
    dto.id = block.getId();
    dto.templateId = block.getTemplateId();
    dto.parentBlockId = block.getParentBlockId();
    dto.type = block.getType();
    dto.content = block.getContent();
    dto.orderIndex = block.getOrderIndex();
    dto.createdAt = block.getCreatedAt();
    dto.updatedAt = block.getUpdatedAt();
    return dto;
  }
}
