import { PageTemplate } from 'src/modules/content/domain/aggregates/page-template/page-template.aggregate';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface PageTemplateRepository {
  findById(id: string, context?: PersistenceContext): Promise<PageTemplate | null>;
  findByWorkspace(workspaceId: string, context?: PersistenceContext): Promise<PageTemplate[]>;
  save(template: PageTemplate, context?: PersistenceContext): Promise<PageTemplate>;
  delete(id: string, context?: PersistenceContext): Promise<void>;
}
