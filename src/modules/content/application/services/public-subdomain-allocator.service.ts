import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from '../../content.types';
import { RESERVED_PUBLISHED_SITE_SUBDOMAINS } from '../../domain/constants/published-site.constant';
import type { PageRepository } from '../../domain/repositories/page.repository';
import type { PublishedSiteRepository } from '../../domain/repositories/published-site.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { generateSlug } from 'src/utils';

@Injectable()
export class PublicSubdomainAllocatorService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
  ) {}

  // Caller holds the workspace hierarchy lock. The global lock serializes
  // allocation across workspaces and must precede any site row lock.
  async allocate(value: string, context: PersistenceContext): Promise<string> {
    await this.pages.lockGlobalSubdomainAllocation(context);
    const normalized = generateSlug(value).toLowerCase();
    const base =
      normalized
        .replace(/^-+|-+$/g, '')
        .slice(0, 63)
        .replace(/-+$/g, '') || 'page';
    for (let suffix = 1; suffix <= 10000; suffix++) {
      const ending = suffix === 1 ? '' : `-${suffix}`;
      const candidate = `${base.slice(0, 63 - ending.length).replace(/-+$/g, '')}${ending}`;
      if (
        !RESERVED_PUBLISHED_SITE_SUBDOMAINS.has(candidate) &&
        !(await this.pages.existsByPublicSubdomain(candidate, context)) &&
        !(await this.sites.existsBySubdomain(candidate, context))
      )
        return candidate;
    }
    throw new BadRequestException('Public subdomain allocation limit exceeded');
  }
}
