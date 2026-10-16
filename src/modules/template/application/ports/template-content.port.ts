import type { PageTemplateRepository } from '../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../domain/repositories/template-version.repository';

/** Template-owned access; callers must forward their UnitOfWork context. */
export type TemplateContentPort = Pick<
  PageTemplateRepository,
  'findById' | 'findByIdForUpdate' | 'save' | 'findMany' | 'findPublicById'
>;

export type TemplateVersionPort = Pick<
  TemplateVersionRepository,
  'findById' | 'findByIdForUpdate' | 'findPublishedByTemplateId' | 'save'
>;
