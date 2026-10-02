import { TemplateVersion } from '../aggregates/template-version/template-version.aggregate';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

export interface TemplateVersionRepository {
  create(
    version: TemplateVersion,
    context?: PersistenceContext,
  ): Promise<TemplateVersion>;

  save(
    version: TemplateVersion,
    context?: PersistenceContext,
  ): Promise<TemplateVersion>;

  findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null>;

  findByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion[]>;

  findPublishedByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null>;

  findLatestByTemplateId(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null>;

  findByIdForUpdate(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplateVersion | null>;

  getNextVersionNumber(
    templateId: string,
    context?: PersistenceContext,
  ): Promise<number>;
}
