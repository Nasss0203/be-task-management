import { PageTemplateBlock } from '../../domain/entities/page_template_block.entity';

export interface PageTemplateBlocksService {
  findByTemplateId(templateId: string): Promise<PageTemplateBlock[]>;
}
