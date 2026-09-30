import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
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

type MovePlan = {
  disableSites: PublishedSite[];
  unpublish: PagePublication[];
  upsert: PagePublication[];
};

@Injectable()
export class PublicationHierarchySynchronizerService {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
    @Inject(CONTENT_TYPES.repositories.PagePublicationRepository)
    private readonly publications: PagePublicationRepository,
    @Inject(CONTENT_TYPES.repositories.PublishedSiteRepository)
    private readonly sites: PublishedSiteRepository,
  ) {}

  private copy(publication: PagePublication): PagePublication {
    return PagePublication.restore({
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
  }

  async plan(
    page: Page,
    targetParent: Page | null,
    actorId: string,
    context: PersistenceContext,
  ): Promise<MovePlan> {
    const descendants = await this.pages.findDescendants(page.getId(), context);
    const subtree = [page, ...descendants];
    const pageIds = new Set(subtree.map((item) => item.getId()));
    if (pageIds.size !== subtree.length)
      throw new BadRequestException('Duplicate Page in move subtree');
    const children = new Map<string, Page[]>();
    for (const item of descendants) {
      const parentId = item.getParentPageId();
      if (!parentId || !pageIds.has(parentId))
        throw new BadRequestException('Invalid Page move subtree');
      children.set(parentId, [...(children.get(parentId) ?? []), item]);
    }

    const sourcePublications: PagePublication[] = [];
    for (const item of subtree)
      sourcePublications.push(
        ...(await this.publications.findByPageId(item.getId(), context)).filter(
          (entry) => entry.getUnpublishedAt() === null,
        ),
      );
    const sourceSiteIds = new Set(
      sourcePublications.map((entry) => entry.getSiteId()),
    );

    let destinationSite: PublishedSite | null = null;
    let parentPublication: PagePublication | null = null;
    if (targetParent) {
      let root = targetParent;
      const seen = new Set<string>();
      while (root.getParentPageId()) {
        if (seen.has(root.getId()))
          throw new BadRequestException('Cyclic Page hierarchy');
        seen.add(root.getId());
        const next = await this.pages.findById(
          root.getParentPageId()!,
          context,
        );
        if (!next || next.getDeletedAt() !== null)
          throw new BadRequestException(
            'Destination Page ancestor is unavailable',
          );
        root = next;
      }
      if (root.getPublicSubdomain()) {
        const site = await this.sites.findBySubdomain(
          root.getPublicSubdomain()!,
          context,
        );
        if (
          site &&
          site.getRootPageId() === root.getId() &&
          site.getDisabledAt() === null
        ) {
          destinationSite = site;
          parentPublication = await this.publications.findBySiteAndPage(
            site.getId(),
            targetParent.getId(),
            context,
          );
          if (
            !parentPublication ||
            parentPublication.getUnpublishedAt() !== null ||
            !parentPublication.inheritsToChildren()
          )
            parentPublication = null;
        }
      }
    }

    // Site row locks follow the workspace advisory lock and are acquired in ID order.
    const allSiteIds = [
      ...new Set([
        ...sourceSiteIds,
        ...(destinationSite ? [destinationSite.getId()] : []),
      ]),
    ].sort();
    const locked = new Map<string, PublishedSite>();
    for (const id of allSiteIds) {
      const site = await this.sites.findByIdForUpdate(id, context);
      if (!site)
        throw new ConflictException('Publication site changed during move');
      locked.set(id, site);
    }
    if (destinationSite) destinationSite = locked.get(destinationSite.getId())!;

    const disableSites: PublishedSite[] = [];
    if (page.getParentPageId() === null) {
      for (const site of locked.values()) {
        if (site.getRootPageId() === page.getId()) disableSites.push(site);
      }
    }
    const destinationId =
      destinationSite && parentPublication ? destinationSite.getId() : null;
    const unpublish = sourcePublications.filter(
      (entry) =>
        entry.getSiteId() !== destinationId ||
        disableSites.some((site) => site.getId() === entry.getSiteId()),
    );
    const unpublishedIds = new Set(unpublish.map((entry) => entry.getId()));
    for (const site of disableSites) {
      for (const entry of await this.publications.findBySiteId(
        site.getId(),
        context,
      )) {
        if (
          entry.getUnpublishedAt() === null &&
          !unpublishedIds.has(entry.getId())
        ) {
          unpublish.push(entry);
          unpublishedIds.add(entry.getId());
        }
      }
    }
    const upsert: PagePublication[] = [];
    if (destinationId && parentPublication && destinationSite) {
      const existing = await this.publications.findBySiteId(
        destinationId,
        context,
      );
      const byPage = new Map(
        existing.map((entry) => [entry.getPageId(), entry]),
      );
      const movingIds = new Set(
        subtree
          .map((item) => byPage.get(item.getId())?.getId())
          .filter((id): id is string => Boolean(id)),
      );
      const occupied = new Set(
        existing
          .filter((entry) => !movingIds.has(entry.getId()))
          .map((entry) => entry.getPath()),
      );
      const pending = [{ page, parent: parentPublication }];
      const visited = new Set<string>();
      while (pending.length) {
        const { page: current, parent } = pending.shift()!;
        if (visited.has(current.getId()))
          throw new BadRequestException('Cyclic Page move subtree');
        visited.add(current.getId());
        const old = byPage.get(current.getId());
        if (old?.getPublicationType() === PagePublicationType.DIRECT)
          throw new ConflictException(
            'Historical DIRECT child publication cannot be moved automatically',
          );
        const segment =
          old?.getPath().split('/').pop() ||
          current.getSlug() ||
          generateSlug(current.getTitle()) ||
          'page';
        const prefix = parent.getPath() === '/' ? '' : parent.getPath();
        let path = '';
        for (let suffix = 1; suffix <= 10000; suffix++) {
          const candidate = `${prefix}/${segment}${suffix === 1 ? '' : `-${suffix}`}`;
          if (!occupied.has(candidate)) {
            path = candidate;
            break;
          }
        }
        if (!path || path.length > 2048)
          throw new ConflictException('Publication path allocation failed');
        occupied.add(path);
        const next = old
          ? this.copy(old)
          : PagePublication.create({
              siteId: destinationId,
              pageId: current.getId(),
              path,
              parentPublicationId: parent.getId(),
              publicationType: PagePublicationType.INHERITED,
              publishedBy: actorId,
            });
        if (old) {
          next.rebase(path, parent.getId());
          if (next.getUnpublishedAt() !== null) next.republish(actorId);
        }
        upsert.push(next);
        for (const child of [...(children.get(current.getId()) ?? [])].sort(
          (a, b) =>
            a.getCreatedAt().getTime() - b.getCreatedAt().getTime() ||
            a.getId().localeCompare(b.getId()),
        ))
          pending.push({ page: child, parent: next });
      }
      if (visited.size !== subtree.length)
        throw new BadRequestException('Incomplete Page move subtree');
    }
    return { disableSites, unpublish, upsert };
  }

  async execute(plan: MovePlan, context: PersistenceContext): Promise<void> {
    const now = new Date();
    for (const site of plan.disableSites) {
      site.disable(now);
      await this.sites.save(site, context);
    }
    for (const publication of plan.unpublish) {
      publication.unpublish(now);
      await this.publications.save(publication, context);
    }
    for (const publication of plan.upsert)
      await this.publications.save(publication, context);
  }
}
