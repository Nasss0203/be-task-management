import { PageTemplate } from 'src/modules/content/domain/aggregates/page-template/page-template.aggregate';
import { EntityManager } from 'typeorm';
type PersistenceContext = { manager?: EntityManager };

export interface PageTemplateRepository {
  findById(id: string, context?: PersistenceContext): Promise<PageTemplate | null>;
  findByWorkspace(workspaceId: string, context?: PersistenceContext): Promise<PageTemplate[]>;
  save(template: PageTemplate, context?: PersistenceContext): Promise<PageTemplate>;
  delete(id: string, context?: PersistenceContext): Promise<void>;
}
