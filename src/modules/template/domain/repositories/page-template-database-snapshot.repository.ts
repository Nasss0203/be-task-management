import { PersistenceContext } from 'src/shared/domain/persistence-context';

import { PageTemplateDatabase } from '../aggregates/template-database/page-template-database.aggregate';

export interface PageTemplateDatabaseSnapshotRepository {
  saveMany(
    databases: PageTemplateDatabase[],
    context?: PersistenceContext,
  ): Promise<PageTemplateDatabase[]>;

  findByVersionId(
    versionId: string,
    context?: PersistenceContext,
  ): Promise<PageTemplateDatabase[]>;
}
  