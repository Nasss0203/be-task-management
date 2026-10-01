import { Inject, Injectable } from '@nestjs/common';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { CONTENT_TYPES } from '../../content.types';
import { Page } from '../../domain/aggregates/page/page.aggregate';
import { PagePublication } from '../../domain/entities/page-publication.entity';
import { PublishedSite } from '../../domain/entities/published-site.entity';
import { PagePublicationType } from '../../domain/enums/page-publication-type.enum';
import type { PagePublicationRepository } from '../../domain/repositories/page-publication.repository';
import type { PageRepository } from '../../domain/repositories/page.repository';

@Injectable()
export class PublicationAvailabilityService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaces: WorkspaceRepository,
  ) {}

  async resolve(
    site: PublishedSite,
    publication: PagePublication,
  ): Promise<{
    page: Page;
    breadcrumbs: { page_id: string; title: string; path: string }[];
  } | null> {
    if (
      site.getDisabledAt() !== null ||
      !(await this.workspaces.findById(site.getWorkspaceId()))
    )
      return null;
    const seen = new Set<string>();
    const breadcrumbs: { page_id: string; title: string; path: string }[] = [];
    let cursor = publication;
    let currentPage: Page | null = null;
    while (true) {
      if (
        seen.has(cursor.getId()) ||
        cursor.getSiteId() !== site.getId() ||
        (cursor.getUnpublishedAt() !== null &&
          (cursor.getId() === publication.getId() ||
            cursor.getParentPublicationId() === null))
      )
        return null;
      seen.add(cursor.getId());
      const page = await this.pages.findById(cursor.getPageId());
      if (
        !page ||
        page.getDeletedAt() !== null ||
        page.getWorkspaceId() !== site.getWorkspaceId()
      )
        return null;
      currentPage ??= page;
      // Hidden ancestors establish the URL hierarchy without exposing metadata.
      if (cursor.getUnpublishedAt() === null)
        breadcrumbs.push({
          page_id: page.getId(),
          title: page.getTitle(),
          path: cursor.getPath(),
        });
      const parentId = cursor.getParentPublicationId();
      if (parentId === null) {
        if (
          cursor.getPath() !== '/' ||
          cursor.getPageId() !== site.getRootPageId() ||
          page.getParentPageId() !== null ||
          page.getPublicSubdomain() !== site.getSubdomain()
        )
          return null;
        return { page: currentPage, breadcrumbs: breadcrumbs.reverse() };
      }
      const parent = await this.publications.findById(parentId);
      if (!parent) return null;
      if (
        cursor.getPublicationType() === PagePublicationType.INHERITED &&
        page.getParentPageId() !== parent.getPageId()
      )
        return null;
      cursor = parent;
    }
  }

  async isAvailable(
    site: PublishedSite,
    publication: PagePublication,
  ): Promise<boolean> {
    return (await this.resolve(site, publication)) !== null;
  }
}
