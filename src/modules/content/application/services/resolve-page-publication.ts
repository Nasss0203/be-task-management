import { ConflictException } from '@nestjs/common';
import type { PagePublicationRepository } from '../../domain/repositories/page-publication.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export async function resolvePagePublication(
  repository: PagePublicationRepository,
  pageId: string,
  siteId?: string,
  context?: PersistenceContext,
) {
  if (siteId) return repository.findBySiteAndPage(siteId, pageId, context);
  const publications = await repository.findByPageId(pageId, context);
  const roots = publications.filter(
    (publication) => publication.getPath() === '/',
  );
  if (roots.length === 1) return roots.pop()!;
  if (publications.length > 1)
    throw new ConflictException('Multiple publications found; specify site_id');
  return publications.pop() ?? null;
}
