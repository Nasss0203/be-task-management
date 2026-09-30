import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CONTENT_TYPES } from '../../content.types';
import { Page } from '../../domain/aggregates/page/page.aggregate';
import { PagePublication } from '../../domain/entities/page-publication.entity';
import { PublishedSite } from '../../domain/entities/published-site.entity';
import { PagePublicationType } from '../../domain/enums/page-publication-type.enum';
import type { PageRepository } from '../../domain/repositories/page.repository';
import type { PagePublicationRepository } from '../../domain/repositories/page-publication.repository';
import type { PublishedSiteRepository } from '../../domain/repositories/published-site.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { generateSlug } from 'src/utils';

@Injectable()
export class PagePublicationTreeService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
  ) {}

  async lockWorkspace(
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<void> {
    await this.pages.lockWorkspaceHierarchy(workspaceId, context);
  }

  private async validateParentChain(
    site: PublishedSite,
    publication: PagePublication,
    existing: PagePublication[],
    context: PersistenceContext,
  ): Promise<void> {
    const byId = new Map(existing.map((entry) => [entry.getId(), entry]));
    const seen = new Set<string>();
    let cursor = publication;
    while (true) {
      if (
        seen.has(cursor.getId()) ||
        cursor.getSiteId() !== site.getId() ||
        cursor.getUnpublishedAt() !== null
      ) {
        throw new BadRequestException('Publication ancestor is unavailable');
      }
      seen.add(cursor.getId());
      this.validatePage(
        await this.pages.findById(cursor.getPageId(), context),
        site,
      );
      const parentId = cursor.getParentPublicationId();
      if (parentId === null) {
        if (
          cursor.getPath() !== '/' ||
          cursor.getPageId() !== site.getRootPageId()
        )
          throw new BadRequestException('Invalid root publication');
        return;
      }
      const parent = byId.get(parentId);
      if (!parent)
        throw new BadRequestException('Publication parent not found');
      cursor = parent;
    }
  }

  private validatePage(
    page: Page | null,
    site: PublishedSite,
  ): asserts page is Page {
    if (!page || page.getDeletedAt() !== null)
      throw new NotFoundException('Published page not found');
    if (page.getWorkspaceId() !== site.getWorkspaceId())
      throw new BadRequestException(
        'Page and site must belong to the same workspace',
      );
  }

  private availablePath(
    parent: PagePublication,
    page: Page,
    paths: Set<string>,
  ): string {
    const slug = generateSlug(page.getTitle()) || 'page';
    const prefix = parent.getPath() === '/' ? '' : parent.getPath();
    let path = `${prefix}/${slug}`;
    let suffix = 2;
    while (paths.has(path)) path = `${prefix}/${slug}-${suffix++}`;
    return path;
  }

  private revived(
    publication: PagePublication,
    userId: string,
  ): PagePublication {
    // Do not mutate repository-owned entities until the complete plan is valid.
    const restored = PagePublication.restore({
      id: publication.getId(),
      siteId: publication.getSiteId(),
      pageId: publication.getPageId(),
      path: publication.getPath(),
      parentPublicationId: publication.getParentPublicationId(),
      publicationType: publication.getPublicationType(),
      includeDescendants: publication.getIncludeDescendants(),
      publishedBy: publication.getPublishedBy(),
      publishedAt: publication.getPublishedAt(),
      unpublishedAt: publication.getUnpublishedAt(),
      updatedAt: publication.getUpdatedAt(),
    });
    restored.republish(userId);
    return restored;
  }

  async buildPlan(
    site: PublishedSite,
    direct: PagePublication,
    userId: string,
    context: PersistenceContext,
    options: { existingPublications?: PagePublication[] } = {},
  ): Promise<PagePublication[]> {
    if (site.getDisabledAt() !== null)
      throw new BadRequestException('Published site is disabled');
    if (direct.getSiteId() !== site.getId())
      throw new BadRequestException('Invalid publication site');
    const page = await this.pages.findById(direct.getPageId(), context);
    this.validatePage(page, site);
    const existing =
      options.existingPublications ??
      (await this.publications.findBySiteId(site.getId(), context));
    const byPage = new Map(existing.map((entry) => [entry.getPageId(), entry]));
    const paths = new Set(existing.map((entry) => entry.getPath()));
    const duplicate = existing.find(
      (entry) =>
        entry.getPath() === direct.getPath() &&
        entry.getId() !== direct.getId(),
    );
    if (duplicate)
      throw new ConflictException('Publication path is already in use');
    const samePage = byPage.get(direct.getPageId());
    if (samePage && samePage.getId() !== direct.getId())
      throw new ConflictException(
        'Page already has a publication in this site',
      );
    if (direct.getPath() === '/') {
      if (
        direct.getPageId() !== site.getRootPageId() ||
        direct.getParentPublicationId() !== null
      )
        throw new BadRequestException('Invalid root publication');
    } else {
      const parent = existing.find(
        (entry) => entry.getId() === direct.getParentPublicationId(),
      );
      if (!parent || parent.getSiteId() !== site.getId())
        throw new BadRequestException('Publication parent not found');
      await this.validateParentChain(site, parent, existing, context);
    }
    const plan = [direct];
    paths.add(direct.getPath());
    if (!direct.inheritsToChildren()) return plan;
    const descendants = await this.pages.findDescendants(page.getId(), context);
    const pageIds = new Set([page.getId()]);
    const children = new Map<string, Page[]>();
    for (const child of descendants) {
      this.validatePage(child, site);
      if (pageIds.has(child.getId()))
        throw new BadRequestException('Duplicate page in hierarchy');
      pageIds.add(child.getId());
      const parentId = child.getParentPageId();
      if (!parentId) throw new BadRequestException('Invalid page hierarchy');
      children.set(parentId, [...(children.get(parentId) ?? []), child]);
    }
    // Validate reachability/cycles before writing, even for branches stopped by DIRECT records.
    const reachable = new Set<string>();
    const pendingIds = [page.getId()];
    while (pendingIds.length > 0) {
      const id = pendingIds.pop()!;
      if (reachable.has(id))
        throw new BadRequestException('Cyclic page hierarchy');
      reachable.add(id);
      for (const child of children.get(id) ?? [])
        pendingIds.push(child.getId());
    }
    if (reachable.size !== pageIds.size)
      throw new BadRequestException('Invalid page hierarchy');
    const pending = [direct];
    while (pending.length > 0) {
      const parent = pending.pop()!;
      const siblings = [...(children.get(parent.getPageId()) ?? [])].sort(
        (a, b) =>
          a.getCreatedAt().getTime() - b.getCreatedAt().getTime() ||
          a.getId().localeCompare(b.getId()),
      );
      for (const child of siblings) {
        let publication = byPage.get(child.getId());
        if (publication?.getPublicationType() === PagePublicationType.DIRECT) {
          // Independent DIRECT records keep both their lifecycle and persisted path.
          if (
            publication.getUnpublishedAt() === null &&
            publication.getIncludeDescendants()
          )
            pending.push(publication);
          continue;
        }
        if (
          publication &&
          publication.getParentPublicationId() !== parent.getId()
        ) {
          // Reparent/public-path synchronization is deliberately deferred.
          continue;
        }
        if (publication) {
          if (publication.getUnpublishedAt() !== null)
            publication = this.revived(publication, userId);
        } else {
          publication = PagePublication.create({
            siteId: site.getId(),
            pageId: child.getId(),
            path: this.availablePath(parent, child, paths),
            parentPublicationId: parent.getId(),
            publicationType: PagePublicationType.INHERITED,
            publishedBy: userId,
          });
        }
        paths.add(publication.getPath());
        plan.push(publication);
        pending.push(publication);
      }
    }
    if (
      new Set(plan.map((entry) => entry.getPageId())).size !== plan.length ||
      new Set(plan.map((entry) => entry.getPath())).size !== plan.length
    )
      throw new ConflictException('Duplicate publication in plan');
    return plan;
  }

  async buildSiteReconciliationPlan(
    site: PublishedSite,
    root: PagePublication,
    userId: string,
    context: PersistenceContext,
  ): Promise<PagePublication[]> {
    const existing = await this.publications.findBySiteId(
      site.getId(),
      context,
    );
    const overlay = new Map(existing.map((entry) => [entry.getId(), entry]));
    overlay.set(root.getId(), root);
    const plan = new Map<string, PagePublication>();
    const roots = [
      root,
      ...existing
        .filter(
          (entry) =>
            entry.getId() !== root.getId() &&
            entry.getPublicationType() === PagePublicationType.DIRECT &&
            entry.getUnpublishedAt() === null &&
            entry.getIncludeDescendants(),
        )
        .sort((a, b) => a.getId().localeCompare(b.getId())),
    ];
    for (const direct of roots) {
      if (direct.getId() !== root.getId()) {
        const page = await this.pages.findById(direct.getPageId(), context);
        // Soft-deleted independent branches remain reserved but are not public candidates.
        if (!page || page.getDeletedAt() !== null) continue;
      }
      const branch = await this.buildPlan(site, direct, userId, context, {
        existingPublications: [...overlay.values()],
      });
      for (const entry of branch) {
        overlay.set(entry.getId(), entry);
        plan.set(entry.getId(), entry);
      }
    }
    return [...plan.values()];
  }

  async executePlan(
    plan: PagePublication[],
    context: PersistenceContext,
  ): Promise<void> {
    // Parent-first ordering satisfies the self-referencing FK. Caller owns the transaction.
    for (const publication of plan)
      await this.publications.save(publication, context);
  }

  async inheritNewPage(
    page: Page,
    userId: string,
    context: PersistenceContext,
  ): Promise<void> {
    const parentPageId = page.getParentPageId();
    if (!parentPageId) return;
    const parents = (
      await this.publications.findByPageId(parentPageId, context)
    )
      .filter(
        (entry) =>
          entry.getUnpublishedAt() === null && entry.inheritsToChildren(),
      )
      .sort((a, b) => a.getSiteId().localeCompare(b.getSiteId()));
    const plans: PagePublication[] = [];
    for (const candidate of parents) {
      // Serialize path allocation with publish/republish/unpublish in the same site.
      const site = await this.sites.findByIdForUpdate(
        candidate.getSiteId(),
        context,
      );
      if (!site || site.getDisabledAt() !== null) continue;
      const parent = await this.publications.findById(
        candidate.getId(),
        context,
      );
      if (
        !parent ||
        parent.getUnpublishedAt() !== null ||
        !parent.inheritsToChildren()
      )
        continue;
      this.validatePage(page, site);
      await this.validateParentChain(
        site,
        parent,
        await this.publications.findBySiteId(site.getId(), context),
        context,
      );
      if (
        await this.publications.findBySiteAndPage(
          site.getId(),
          page.getId(),
          context,
        )
      )
        continue;
      const paths = new Set(
        (await this.publications.findBySiteId(site.getId(), context)).map(
          (entry) => entry.getPath(),
        ),
      );
      plans.push(
        PagePublication.create({
          siteId: site.getId(),
          pageId: page.getId(),
          path: this.availablePath(parent, page, paths),
          parentPublicationId: parent.getId(),
          publicationType: PagePublicationType.INHERITED,
          publishedBy: userId,
        }),
      );
    }
    await this.executePlan(plans, context);
  }

  async unpublishBranch(
    publication: PagePublication,
    context: PersistenceContext,
    now: Date,
  ): Promise<void> {
    const entries = await this.publications.findBySiteId(
      publication.getSiteId(),
      context,
    );
    const visited = new Set<string>();
    const pending = publication.inheritsToChildren() ? [publication] : [];
    while (pending.length > 0) {
      const parent = pending.pop()!;
      if (visited.has(parent.getId()))
        throw new BadRequestException('Cyclic publication hierarchy');
      visited.add(parent.getId());
      for (const child of entries.filter(
        (entry) =>
          entry.getParentPublicationId() === parent.getId() &&
          entry.getPublicationType() === PagePublicationType.INHERITED,
      )) {
        child.unpublish(now);
        await this.publications.save(child, context);
        pending.push(child);
      }
    }
  }
}
