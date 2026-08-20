import { PageTemplateBlock } from 'src/modules/content/domain/entities/page-template-block.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface PageTemplateBlockRepository {
  findById(id: string, context?: PersistenceContext): Promise<PageTemplateBlock | null>;
  findByTemplateId(templateId: string, context?: PersistenceContext): Promise<PageTemplateBlock[]>;
  save(block: PageTemplateBlock, context?: PersistenceContext): Promise<PageTemplateBlock>;
  delete(id: string, context?: PersistenceContext): Promise<void>;
}
