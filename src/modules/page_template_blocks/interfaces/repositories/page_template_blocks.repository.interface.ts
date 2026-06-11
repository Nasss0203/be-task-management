import { PageTemplateBlock } from '../../domain/entities/page_template_block.entity';

export interface PageTemplateBlocksRepository {
  findByTemplateId(templateId: string): Promise<PageTemplateBlock[]>;
}
