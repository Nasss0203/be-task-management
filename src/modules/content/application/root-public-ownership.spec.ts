/* Repository doubles intentionally do not perform I/O. */
/* eslint-disable @typescript-eslint/require-await */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { Page } from '../domain/aggregates/page/page.aggregate';
import { PageBlock } from '../domain/entities/page-block.entity';
import { PagePublication } from '../domain/entities/page-publication.entity';
import { PublishedSite } from '../domain/entities/published-site.entity';
import { PagePublicationType } from '../domain/enums/page-publication-type.enum';
import type { PageBlockRepository } from '../domain/repositories/page-block.repository';
import type { PagePublicationRepository } from '../domain/repositories/page-publication.repository';
import type { PageRepository } from '../domain/repositories/page.repository';
import type { PublishedSiteRepository } from '../domain/repositories/published-site.repository';
import { PublishPageToSiteCommand } from './commands/page-publication/publish-page-to-site/publish-page-to-site.command';
import { PublishPageToSiteHandler } from './commands/page-publication/publish-page-to-site/publish-page-to-site.handler';
import { PublishSiteCommand } from './commands/page-publication/publish-site/publish-site.command';
import { PublishSiteHandler } from './commands/page-publication/publish-site/publish-site.handler';
import { RepublishSiteCommand } from './commands/page-publication/republish-site/republish-site.command';
import { RepublishSiteHandler } from './commands/page-publication/republish-site/republish-site.handler';
import { UnpublishSiteCommand } from './commands/page-publication/unpublish-site/unpublish-site.command';
import { UnpublishSiteHandler } from './commands/page-publication/unpublish-site/unpublish-site.handler';
import { UpdatePagePublicationSettingsCommand } from './commands/page-publication/update-page-publication-settings/update-page-publication-settings.command';
import { UpdatePagePublicationSettingsHandler } from './commands/page-publication/update-page-publication-settings/update-page-publication-settings.handler';
import { UpdatePageVisibilityHandler } from './commands/page-publication/update-page-visibility.handler';
import { CreatePageCommand } from './commands/page/create-page/create-page.command';
import { CreatePageHandler } from './commands/page/create-page/create-page.handler';
import { DuplicatePageCommand } from './commands/page/duplicate-page/duplicate-page.command';
import { DuplicatePageHandler } from './commands/page/duplicate-page/duplicate-page.handler';
import { MovePageCommand } from './commands/page/move-page/move-page.command';
import { MovePageHandler } from './commands/page/move-page/move-page.handler';
import { GetPagePublicationHandler } from './queries/page-publication/get-page-publication/get-page-publication.handler';
import { GetPagePublicationQuery } from './queries/page-publication/get-page-publication/get-page-publication.query';
import { GetPublicPageHandler } from './queries/page-publication/get-public-page/get-public-page.handler';
import { GetPublicPageQuery } from './queries/page-publication/get-public-page/get-public-page.query';
import { PagePublicationTreeService } from './services/page-publication-tree.service';
import { PublicSubdomainAllocatorService } from './services/public-subdomain-allocator.service';
import { PublicationAvailabilityService } from './services/publication-availability.service';
import { PublicationHierarchySynchronizerService } from './services/publication-hierarchy-synchronizer.service';

describe('root-owned public sites', () => {
  const workspace = 'workspace-a';
  const context = {};
  let pages: Map<string, Page>;
  let sites: Map<string, PublishedSite>;
  let publications: Map<string, PagePublication>;
  let pageRepo: PageRepository;
  let siteRepo: PublishedSiteRepository;
  let publicationRepo: PagePublicationRepository;
  let allocator: PublicSubdomainAllocatorService;
  let tree: PagePublicationTreeService;
  let create: CreatePageHandler;
  let duplicate: DuplicatePageHandler;
  let move: MovePageHandler;
  let publish: PublishSiteHandler;
  let legacyAttach: PublishPageToSiteHandler;
  let availability: PublicationAvailabilityService;
  let visibility: UpdatePageVisibilityHandler;
  const authorize = jest.fn().mockResolvedValue(true);
  const auth = { authorize } as unknown as AuthorizationService;
  const uow: UnitOfWork = { runInTransaction: (fn) => fn(context) };
  const publication = (siteId: string, pageId: string) =>
    [...publications.values()].find(
      (p) => p.getSiteId() === siteId && p.getPageId() === pageId,
    );
  const createPage = async (
    title: string,
    parentId?: string,
    workspaceId = workspace,
  ) => {
    const result = await create.execute(
      new CreatePageCommand('user', workspaceId, title, undefined, parentId),
    );
    return pages.get(result.id)!;
  };
  const publishRoot = async (page: Page, include = true, subdomain?: string) =>
    publish.execute(
      new PublishSiteCommand('user', page.getId(), subdomain, include),
    );
  const movePage = (page: Page, parent: Page | null) =>
    move.execute(
      new MovePageCommand(
        'user',
        workspace,
        page.getId(),
        parent?.getId() ?? null,
        null,
      ),
    );

  beforeEach(() => {
    pages = new Map();
    sites = new Map();
    publications = new Map();
    authorize.mockReset().mockResolvedValue(true);
    pageRepo = {
      lockWorkspaceHierarchy: async () => undefined,
      lockGlobalSubdomainAllocation: async () => undefined,
      existsByPublicSubdomain: async (name: string) =>
        [...pages.values()].some((p) => p.getPublicSubdomain() === name),
      existsBySlug: async (workspaceId: string, slug: string) =>
        [...pages.values()].some(
          (p) => p.getWorkspaceId() === workspaceId && p.getSlug() === slug,
        ),
      findById: async (id: string) => pages.get(id) ?? null,
      findDescendants: async (id: string) => {
        const result: Page[] = [];
        const visit = (parentId: string) => {
          for (const page of pages.values())
            if (page.getParentPageId() === parentId) {
              result.push(page);
              visit(page.getId());
            }
        };
        visit(id);
        return result;
      },
      save: async (page: Page) => {
        pages.set(page.getId(), page);
        return page;
      },
      moveHierarchy: async (
        id: string,
        parentId: string | null,
        teamspaceId: string | null,
        _ctx: unknown,
        subdomain?: string | null,
      ) => {
        const original = pages.get(id)!;
        const updated = Page.restore({
          id,
          workspaceId: original.getWorkspaceId(),
          title: original.getTitle(),
          slug: original.getSlug(),
          icon: original.getIcon(),
          coverUrl: original.getCoverUrl(),
          isTemplate: original.getIsTemplate(),
          teamspaceId,
          parentPageId: parentId,
          publicSubdomain: subdomain ?? null,
          createdBy: original.getCreatedBy(),
          createdAt: original.getCreatedAt(),
          updatedAt: new Date(),
          deletedAt: original.getDeletedAt(),
          deletedBy: original.getDeletedBy(),
        });
        pages.set(id, updated);
      },
    } as unknown as PageRepository;
    siteRepo = {
      findById: async (id: string) => sites.get(id) ?? null,
      findByIdForUpdate: async (id: string) => sites.get(id) ?? null,
      findBySubdomain: async (name: string) =>
        [...sites.values()].find((s) => s.getSubdomain() === name) ?? null,
      findActiveBySubdomain: async (name: string) =>
        [...sites.values()].find(
          (s) => s.getSubdomain() === name && s.getDisabledAt() === null,
        ) ?? null,
      existsBySubdomain: async (name: string) =>
        [...sites.values()].some((s) => s.getSubdomain() === name),
      save: async (site: PublishedSite) => {
        sites.set(site.getId(), site);
        return site;
      },
    } as unknown as PublishedSiteRepository;
    publicationRepo = {
      findById: async (id: string) => publications.get(id) ?? null,
      findByPageId: async (id: string) =>
        [...publications.values()].filter((p) => p.getPageId() === id),
      findBySiteId: async (id: string) =>
        [...publications.values()].filter((p) => p.getSiteId() === id),
      findBySiteAndPage: async (siteId: string, pageId: string) =>
        publication(siteId, pageId) ?? null,
      findBySiteAndPath: async (siteId: string, path: string) =>
        [...publications.values()].find(
          (p) => p.getSiteId() === siteId && p.getPath() === path,
        ) ?? null,
      findActiveBySiteAndPath: async (siteId: string, path: string) =>
        [...publications.values()].find(
          (p) =>
            p.getSiteId() === siteId &&
            p.getPath() === path &&
            p.getUnpublishedAt() === null,
        ) ?? null,
      save: async (p: PagePublication) => {
        publications.set(p.getId(), p);
        return p;
      },
    } as unknown as PagePublicationRepository;
    allocator = new PublicSubdomainAllocatorService(pageRepo, siteRepo);
    tree = new PagePublicationTreeService(pageRepo, publicationRepo, siteRepo);
    availability = new PublicationAvailabilityService(
      pageRepo,
      publicationRepo,
      {
        findById: async () => ({}),
      } as unknown as WorkspaceRepository,
    );
    visibility = new UpdatePageVisibilityHandler(
      pageRepo,
      publicationRepo,
      siteRepo,
      uow,
      tree,
      availability,
    );
    const hierarchy = new PublicationHierarchySynchronizerService(
      pageRepo,
      publicationRepo,
      siteRepo,
    );
    create = new CreatePageHandler(pageRepo, auth, uow, tree, allocator);
    duplicate = new DuplicatePageHandler(
      pageRepo,
      {
        findByPageId: async () => [],
        save: async (block: PageBlock) => block,
      } as unknown as PageBlockRepository,
      uow,
      tree,
      allocator,
    );
    move = new MovePageHandler(pageRepo, uow, auth, allocator, hierarchy);
    publish = new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
      tree,
    );
    legacyAttach = new PublishPageToSiteHandler(
      siteRepo,
      pageRepo,
      publicationRepo,
      uow,
      auth,
      tree,
    );
  });

  it('reserves global deterministic names while keeping child Pages without a subdomain', async () => {
    const first = await createPage('Docs');
    const second = await createPage('Docs', undefined, 'workspace-b');
    const child = await createPage('Docs', first.getId());
    expect(first.getPublicSubdomain()).toBe('docs');
    expect(second.getPublicSubdomain()).toBe('docs-2');
    expect(child.getPublicSubdomain()).toBeNull();
    expect(child.getParentPageId()).toBe(first.getId());
  });

  it('duplicates roots with a new reservation and children without one', async () => {
    const home = await createPage('Home');
    const child = await createPage('About', home.getId());
    const rootCopy = await duplicate.execute(
      new DuplicatePageCommand('user', workspace, home.getId()),
    );
    const childCopy = await duplicate.execute(
      new DuplicatePageCommand('user', workspace, child.getId()),
    );
    expect(rootCopy.public_subdomain).toBe('home-copy');
    expect(childCopy.public_subdomain).toBeNull();
  });

  it('publishes only roots with their reservation and inherits new children', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    await expect(publishRoot(home, true, 'other')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(publishRoot(about)).rejects.toBeInstanceOf(ConflictException);
    const response = await publishRoot(home);
    expect(response.subdomain).toBe('home');
    expect(publication(response.site_id, about.getId())?.getPath()).toBe(
      '/about',
    );
    const pricing = await createPage('Pricing', home.getId());
    expect(
      publication(response.site_id, pricing.getId())?.getPublicationType(),
    ).toBe(PagePublicationType.INHERITED);
    await expect(
      legacyAttach.execute(
        new PublishPageToSiteCommand(
          'user',
          response.site_id,
          about.getId(),
          '/elsewhere',
        ),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('keeps same site and rebases an entire subtree with stable URL segments', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const team = await createPage('Team', about.getId());
    const docs = await createPage('Docs', home.getId());
    const siteId = (await publishRoot(home)).site_id;
    about.update({ title: 'Company' });
    await movePage(about, docs);
    expect(publication(siteId, about.getId())?.getPath()).toBe('/docs/about');
    expect(publication(siteId, team.getId())?.getPath()).toBe(
      '/docs/about/team',
    );
    expect(publication(siteId, about.getId())?.getParentPublicationId()).toBe(
      publication(siteId, docs.getId())?.getId(),
    );
    expect(sites.get(siteId)?.getDisabledAt()).toBeNull();
    const resolved = await availability.resolve(
      sites.get(siteId)!,
      publication(siteId, about.getId())!,
    );
    expect(resolved?.breadcrumbs.map((crumb) => crumb.title)).toEqual([
      'Home',
      'Docs',
      'Company',
    ]);
  });

  it('allocates a suffix on destination path conflict', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const docs = await createPage('Docs', home.getId());
    await createPage('About', docs.getId());
    const siteId = (await publishRoot(home)).site_id;
    await movePage(about, docs);
    expect(publication(siteId, about.getId())?.getPath()).toBe('/docs/about-2');
  });

  it('moves publications across sites without leaving the old branch active', async () => {
    const homeA = await createPage('Home A');
    const about = await createPage('About', homeA.getId());
    const team = await createPage('Team', about.getId());
    const homeB = await createPage('Home B');
    const docs = await createPage('Docs', homeB.getId());
    const siteA = (await publishRoot(homeA)).site_id;
    const siteB = (await publishRoot(homeB)).site_id;
    await movePage(about, docs);
    expect(
      publication(siteA, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(publication(siteA, team.getId())?.getUnpublishedAt()).not.toBeNull();
    expect(publication(siteB, about.getId())?.getPath()).toBe('/docs/about');
    expect(publication(siteB, team.getId())?.getPath()).toBe(
      '/docs/about/team',
    );
  });

  it('detaches public branches moved into a private tree', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const privateRoot = await createPage('Private');
    const siteId = (await publishRoot(home)).site_id;
    await movePage(about, privateRoot);
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(pages.get(about.getId())?.getPublicSubdomain()).toBeNull();
  });

  it('turns root into child by disabling its site, then child into unpublished root', async () => {
    const home = await createPage('Home');
    const other = await createPage('Other');
    const oldSiteId = (await publishRoot(other)).site_id;
    const homeSiteId = (await publishRoot(home)).site_id;
    await movePage(other, home);
    expect(sites.get(oldSiteId)?.getDisabledAt()).not.toBeNull();
    expect(
      publication(oldSiteId, other.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(pages.get(other.getId())?.getPublicSubdomain()).toBeNull();
    expect(publication(homeSiteId, other.getId())?.getPath()).toBe('/other');
    await expect(
      new RepublishSiteHandler(publicationRepo, siteRepo, uow, tree).execute(
        new RepublishSiteCommand('user', other.getId(), oldSiteId),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await movePage(pages.get(other.getId())!, null);
    expect(pages.get(other.getId())?.getPublicSubdomain()).toBe('other-2');
    expect(
      publication(homeSiteId, other.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect([...sites.values()]).toHaveLength(2);
    await publishRoot(pages.get(other.getId())!);
    expect([...sites.values()]).toHaveLength(3);
  });

  it('does not make children public when the root opts out', async () => {
    const home = await createPage('Home');
    const siteId = (await publishRoot(home, false)).site_id;
    const about = await createPage('About', home.getId());
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(
      publication(siteId, about.getId())?.getVisibilityOverride(),
    ).toBeNull();
    expect(about.getPublicSubdomain()).toBeNull();
  });

  it('toggles one child without changing siblings, root policy, or its subdomain', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const docs = await createPage('Docs', home.getId());
    const siteId = (await publishRoot(home)).site_id;
    await visibility.execute(about.getId(), false, 'user');
    expect(publication(siteId, about.getId())?.getVisibilityOverride()).toBe(
      'UNPUBLISHED',
    );
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(publication(siteId, home.getId())?.getUnpublishedAt()).toBeNull();
    expect(publication(siteId, docs.getId())?.getUnpublishedAt()).toBeNull();
    expect(
      await availability.isAvailable(
        sites.get(siteId)!,
        publication(siteId, about.getId())!,
      ),
    ).toBe(false);
    await visibility.execute(about.getId(), true, 'user');
    expect(publication(siteId, about.getId())?.getUnpublishedAt()).toBeNull();
    expect(about.getPublicSubdomain()).toBeNull();
  });

  it('returns 404 from the public API for a private child or disabled root site', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const siteId = (await publishRoot(home)).site_id;
    const publicPage = new GetPublicPageHandler(
      siteRepo,
      publicationRepo,
      { findByPageId: async () => [] } as unknown as PageBlockRepository,
      availability,
    );
    expect(
      (await publicPage.execute(new GetPublicPageQuery('home', '/about'))).page
        .id,
    ).toBe(about.getId());
    await visibility.execute(about.getId(), false, 'user');
    await expect(
      publicPage.execute(new GetPublicPageQuery('home', '/about')),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      (await publicPage.execute(new GetPublicPageQuery('home', '/'))).page.id,
    ).toBe(home.getId());
    const unpublish = new UnpublishSiteHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
    );
    await unpublish.execute(
      new UnpublishSiteCommand('user', home.getId(), siteId),
    );
    await expect(
      publicPage.execute(new GetPublicPageQuery('home', '/')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('preserves manual child visibility through root default changes and republish', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const docs = await createPage('Docs', home.getId());
    const siteId = (await publishRoot(home)).site_id;
    await visibility.execute(about.getId(), false, 'user');
    const settings = new UpdatePagePublicationSettingsHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
      availability,
      auth,
    );
    await settings.execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        home.getId(),
        siteId,
        false,
      ),
    );
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(
      publication(siteId, docs.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    await visibility.execute(docs.getId(), true, 'user');
    expect(publication(siteId, docs.getId())?.getUnpublishedAt()).toBeNull();
    await settings.execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        home.getId(),
        siteId,
        true,
      ),
    );
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    const unpublish = new UnpublishSiteHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
    );
    await unpublish.execute(
      new UnpublishSiteCommand('user', home.getId(), siteId),
    );
    expect(
      await availability.isAvailable(
        sites.get(siteId)!,
        publication(siteId, docs.getId())!,
      ),
    ).toBe(false);
    const republish = new RepublishSiteHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
    );
    await republish.execute(
      new RepublishSiteCommand('user', home.getId(), siteId),
    );
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(publication(siteId, docs.getId())?.getUnpublishedAt()).toBeNull();
  });

  it('moves a manually unpublished child without making the new path public', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const docs = await createPage('Docs', home.getId());
    const siteId = (await publishRoot(home)).site_id;
    await visibility.execute(about.getId(), false, 'user');
    await movePage(about, docs);
    expect(publication(siteId, about.getId())?.getPath()).toBe('/docs/about');
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(publication(siteId, about.getId())?.getVisibilityOverride()).toBe(
      'UNPUBLISHED',
    );
  });

  it('publishes a child explicitly when the root default is off', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const docs = await createPage('Docs', home.getId());
    const siteId = (await publishRoot(home, false)).site_id;
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    await visibility.execute(about.getId(), true, 'user');
    expect(publication(siteId, about.getId())?.getUnpublishedAt()).toBeNull();
    expect(
      publication(siteId, docs.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(about.getPublicSubdomain()).toBeNull();
  });

  it('provides root site context and allocates a path for a legacy child without a row', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const siteId = (await publishRoot(home, false)).site_id;
    publications.delete(publication(siteId, about.getId())!.getId());
    const detail = new GetPagePublicationHandler(
      publicationRepo,
      siteRepo,
      pageRepo,
      availability,
    );
    expect(
      await detail.execute(new GetPagePublicationQuery(about.getId())),
    ).toMatchObject({
      published: false,
      site_id: siteId,
      subdomain: 'home',
      site_active: true,
    });
    await visibility.execute(about.getId(), true, 'user');
    expect(publication(siteId, about.getId())?.getPath()).toBe('/about');
    expect(publication(siteId, about.getId())?.getUnpublishedAt()).toBeNull();
  });

  it('preserves a private override when moving between root sites', async () => {
    const homeA = await createPage('Home A');
    const about = await createPage('About', homeA.getId());
    const homeB = await createPage('Home B');
    const docs = await createPage('Docs', homeB.getId());
    const siteA = (await publishRoot(homeA)).site_id;
    const siteB = (await publishRoot(homeB)).site_id;
    await visibility.execute(about.getId(), false, 'user');
    await movePage(about, docs);
    expect(
      publication(siteA, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(publication(siteB, about.getId())?.getPath()).toBe('/docs/about');
    expect(publication(siteB, about.getId())?.getVisibilityOverride()).toBe(
      'UNPUBLISHED',
    );
    expect(
      publication(siteB, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
  });

  it('publishes a nested child below a private parent without leaking the parent breadcrumb', async () => {
    const home = await createPage('Home');
    const docs = await createPage('Docs', home.getId());
    const api = await createPage('API', docs.getId());
    const siteId = (await publishRoot(home, false)).site_id;
    await visibility.execute(api.getId(), true, 'user');
    expect(
      publication(siteId, docs.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(publication(siteId, api.getId())?.getUnpublishedAt()).toBeNull();
    const publicPage = new GetPublicPageHandler(
      siteRepo,
      publicationRepo,
      { findByPageId: async () => [] } as unknown as PageBlockRepository,
      availability,
    );
    await expect(
      publicPage.execute(new GetPublicPageQuery('home', '/docs')),
    ).rejects.toBeInstanceOf(NotFoundException);
    const result = await publicPage.execute(
      new GetPublicPageQuery('home', '/docs/api'),
    );
    expect(result.page.id).toBe(api.getId());
    expect(result.breadcrumbs.map((crumb) => crumb.title)).toEqual([
      'Home',
      'API',
    ]);
  });

  it('rejects attaching a child to a different root site', async () => {
    const homeA = await createPage('Home A');
    const about = await createPage('About', homeA.getId());
    const homeB = await createPage('Home B');
    const siteB = (await publishRoot(homeB)).site_id;
    await expect(
      legacyAttach.execute(
        new PublishPageToSiteCommand('user', siteB, about.getId(), '/about'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reconciles descendants when root settings change and preserves stable paths', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const siteId = (await publishRoot(home, false)).site_id;
    const handler = new UpdatePagePublicationSettingsHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
      availability,
      auth,
    );
    authorize.mockClear();
    await handler.execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        home.getId(),
        siteId,
        true,
      ),
    );
    const inherited = publication(siteId, about.getId())!;
    expect(inherited.getPath()).toBe('/about');
    expect(inherited.getUnpublishedAt()).toBeNull();
    await handler.execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        home.getId(),
        siteId,
        false,
      ),
    );
    expect(
      publication(siteId, about.getId())?.getUnpublishedAt(),
    ).not.toBeNull();
    await handler.execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        home.getId(),
        siteId,
        true,
      ),
    );
    expect(publication(siteId, about.getId())?.getId()).toBe(inherited.getId());
    expect(authorize).not.toHaveBeenCalled();
  });

  it('updates one owning site capability from a child without creating a child site', async () => {
    const homeA = await createPage('Home A');
    const childA = await createPage('Child A', homeA.getId());
    const homeB = await createPage('Home B');
    const siteAId = (await publishRoot(homeA, false)).site_id;
    const siteBId = (await publishRoot(homeB)).site_id;
    const handler = new UpdatePagePublicationSettingsHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
      availability,
      auth,
    );

    expect(sites.get(siteAId)?.getAllowUpdates()).toBe(false);
    expect(sites.get(siteBId)?.getAllowUpdates()).toBe(false);
    expect(
      publication(siteAId, childA.getId())?.getUnpublishedAt(),
    ).not.toBeNull();

    const enabled = await handler.execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        childA.getId(),
        undefined,
        undefined,
        true,
      ),
    );
    expect(enabled.allow_updates).toBe(true);
    expect(authorize).toHaveBeenLastCalledWith({
      userId: 'user',
      permissions: ['page.update'],
      target: { type: 'page', id: homeA.getId() },
    });
    expect(sites.size).toBe(2);
    expect(sites.get(siteAId)?.getAllowUpdates()).toBe(true);
    expect(sites.get(siteBId)?.getAllowUpdates()).toBe(false);

    const disabled = await handler.execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        homeA.getId(),
        siteAId,
        undefined,
        false,
      ),
    );
    expect(disabled.allow_updates).toBe(false);
    expect(authorize).toHaveBeenLastCalledWith({
      userId: 'user',
      permissions: ['page.update'],
      target: { type: 'page', id: homeA.getId() },
    });
    expect(sites.get(siteAId)?.getAllowUpdates()).toBe(false);
  });

  it('rejects child-only editors and managers of a different site', async () => {
    const homeA = await createPage('Home A');
    const childA = await createPage('Child A', homeA.getId());
    const homeB = await createPage('Home B');
    const siteAId = (await publishRoot(homeA)).site_id;
    const siteBId = (await publishRoot(homeB)).site_id;
    const authorizeSiteManagement = jest.fn(
      ({
        userId,
        target,
      }: {
        userId: string;
        target: { type: string; id: string };
      }) =>
        Promise.resolve(
          (userId === 'child-editor' && target.id === childA.getId()) ||
            (userId === 'site-a-manager' && target.id === homeA.getId()),
        ),
    );
    const handler = new UpdatePagePublicationSettingsHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
      availability,
      {
        authorize: authorizeSiteManagement,
      } as unknown as AuthorizationService,
    );

    await expect(
      authorizeSiteManagement({
        userId: 'child-editor',
        target: { type: 'page', id: childA.getId() },
      }),
    ).resolves.toBe(true);

    await expect(
      handler.execute(
        new UpdatePagePublicationSettingsCommand(
          'child-editor',
          childA.getId(),
          siteAId,
          undefined,
          true,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(authorizeSiteManagement).toHaveBeenLastCalledWith({
      userId: 'child-editor',
      permissions: ['page.update'],
      target: { type: 'page', id: homeA.getId() },
    });
    expect(sites.get(siteAId)?.getAllowUpdates()).toBe(false);

    await expect(
      handler.execute(
        new UpdatePagePublicationSettingsCommand(
          'site-a-manager',
          homeB.getId(),
          siteBId,
          undefined,
          true,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(sites.get(siteBId)?.getAllowUpdates()).toBe(false);
  });

  it('keeps a root reservation through rename, unpublish and republish', async () => {
    const home = await createPage('Home');
    const siteId = (await publishRoot(home)).site_id;
    home.update({ title: 'Developer Portal' });
    await new UnpublishSiteHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
    ).execute(new UnpublishSiteCommand('user', home.getId(), siteId));
    expect(home.getPublicSubdomain()).toBe('home');
    expect(sites.get(siteId)?.getDisabledAt()).not.toBeNull();
    await new RepublishSiteHandler(
      publicationRepo,
      siteRepo,
      uow,
      tree,
    ).execute(new RepublishSiteCommand('user', home.getId(), siteId));
    expect(sites.get(siteId)?.getDisabledAt()).toBeNull();
    expect(home.getPublicSubdomain()).toBe('home');
  });

  it('rolls back a failed move with a transactional repository', async () => {
    const home = await createPage('Home');
    const about = await createPage('About', home.getId());
    const docs = await createPage('Docs', home.getId());
    const siteId = (await publishRoot(home)).site_id;
    const original = publication(siteId, about.getId())!;
    const pageBefore = pages.get(about.getId())!;
    const publicationBefore = PagePublication.restore({
      id: original.getId(),
      siteId,
      pageId: original.getPageId(),
      path: original.getPath(),
      parentPublicationId: original.getParentPublicationId(),
      publicationType: original.getPublicationType(),
      includeDescendants: original.getIncludeDescendants(),
      publishedBy: original.getPublishedBy(),
      publishedAt: original.getPublishedAt(),
      unpublishedAt: original.getUnpublishedAt(),
      updatedAt: original.getUpdatedAt(),
    });
    const rollback: UnitOfWork = {
      runInTransaction: async (fn) => {
        try {
          return await fn(context);
        } catch (error) {
          pages.set(about.getId(), pageBefore);
          publications.set(original.getId(), publicationBefore);
          throw error;
        }
      },
    };
    publicationRepo.save = jest.fn(async (value: PagePublication) => {
      if (
        value.getPageId() === about.getId() &&
        value.getPath() === '/docs/about'
      )
        throw new Error('publication write failed');
      publications.set(value.getId(), value);
      return value;
    });
    const hierarchy = new PublicationHierarchySynchronizerService(
      pageRepo,
      publicationRepo,
      siteRepo,
    );
    const moveWithRollback = new MovePageHandler(
      pageRepo,
      rollback,
      auth,
      allocator,
      hierarchy,
    );
    await expect(
      moveWithRollback.execute(
        new MovePageCommand(
          'user',
          workspace,
          about.getId(),
          docs.getId(),
          null,
        ),
      ),
    ).rejects.toThrow('publication write failed');
    expect(pages.get(about.getId())?.getParentPageId()).toBe(home.getId());
    expect(publication(siteId, about.getId())?.getPath()).toBe('/about');
  });
});
