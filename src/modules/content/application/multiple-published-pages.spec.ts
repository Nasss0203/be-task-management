/* Repository doubles intentionally return resolved promises without I/O. */
/* eslint-disable @typescript-eslint/require-await */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PublishedSite } from '../domain/entities/published-site.entity';
import { PagePublication } from '../domain/entities/page-publication.entity';
import { Page } from '../domain/aggregates/page/page.aggregate';
import type { PublishedSiteRepository } from '../domain/repositories/published-site.repository';
import type { PagePublicationRepository } from '../domain/repositories/page-publication.repository';
import type { PageRepository } from '../domain/repositories/page.repository';
import type { PageBlockRepository } from '../domain/repositories/page-block.repository';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PublishSiteHandler } from './commands/page-publication/publish-site/publish-site.handler';
import { PublishSiteCommand } from './commands/page-publication/publish-site/publish-site.command';
import { PublishPageToSiteHandler } from './commands/page-publication/publish-page-to-site/publish-page-to-site.handler';
import { PublishPageToSiteCommand } from './commands/page-publication/publish-page-to-site/publish-page-to-site.command';
import { UnpublishSiteHandler } from './commands/page-publication/unpublish-site/unpublish-site.handler';
import { UnpublishSiteCommand } from './commands/page-publication/unpublish-site/unpublish-site.command';
import { RepublishSiteHandler } from './commands/page-publication/republish-site/republish-site.handler';
import { RepublishSiteCommand } from './commands/page-publication/republish-site/republish-site.command';
import { UpdatePagePublicationSettingsHandler } from './commands/page-publication/update-page-publication-settings/update-page-publication-settings.handler';
import { UpdatePagePublicationSettingsCommand } from './commands/page-publication/update-page-publication-settings/update-page-publication-settings.command';
import { GetPublicPageHandler } from './queries/page-publication/get-public-page/get-public-page.handler';
import { GetPublicPageQuery } from './queries/page-publication/get-public-page/get-public-page.query';
import { ListSitePublicationsHandler } from './queries/page-publication/list-site-publications/list-site-publications.handler';
import { resolvePagePublication } from './services/resolve-page-publication';
import { PagePublicationTreeService } from './services/page-publication-tree.service';
import { PagePublicationType } from '../domain/enums/page-publication-type.enum';
import { CreatePageHandler } from './commands/page/create-page/create-page.handler';
import { CreatePageCommand } from './commands/page/create-page/create-page.command';
import { ListPagePublicationsHandler } from './queries/page-publication/list-page-publications/list-page-publications.handler';
import { PublicationAvailabilityService } from './services/publication-availability.service';
import { GetPagePublicationHandler } from './queries/page-publication/get-page-publication/get-page-publication.handler';
import { GetPagePublicationQuery } from './queries/page-publication/get-page-publication/get-page-publication.query';
import { DuplicatePageHandler } from './commands/page/duplicate-page/duplicate-page.handler';
import { DuplicatePageCommand } from './commands/page/duplicate-page/duplicate-page.command';

function snapshot(publication: PagePublication): PagePublication {
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

describe('Multiple published pages lifecycle', () => {
  let sites: Map<string, PublishedSite>;
  let publications: Map<string, PagePublication>;
  let pages: Map<string, Page>;
  let siteRepo: PublishedSiteRepository;
  let publicationRepo: PagePublicationRepository;
  let pageRepo: PageRepository;
  let home: Page;
  let about: Page;
  let docs: Page;
  let site: PublishedSite;
  let tree: PagePublicationTreeService;
  let availability: PublicationAvailabilityService;
  const workspaceRepo = {
    findById: async () => ({}),
  } as unknown as WorkspaceRepository;
  const context = {};
  const uow: UnitOfWork = { runInTransaction: (fn) => fn(context) };
  const authorize = jest.fn();
  const authorization = { authorize } as unknown as AuthorizationService;
  const additional = (page: Page, path: string, includeDescendants = false) =>
    new PublishPageToSiteHandler(
      siteRepo,
      pageRepo,
      publicationRepo,
      uow,
      authorization,
      tree,
    ).execute(
      new PublishPageToSiteCommand(
        'user',
        site.getId(),
        page.getId(),
        path,
        includeDescendants,
      ),
    );
  const unpublish = (page: Page) =>
    new UnpublishSiteHandler(publicationRepo, siteRepo, uow, tree).execute(
      new UnpublishSiteCommand('user', page.getId(), site.getId()),
    );
  const republish = (page: Page) =>
    new RepublishSiteHandler(publicationRepo, siteRepo, uow, tree).execute(
      new RepublishSiteCommand('user', page.getId(), site.getId()),
    );
  const updateSettings = (
    page: Page,
    includeDescendants: boolean,
    siteId: string | undefined = site.getId(),
    transaction: UnitOfWork = uow,
  ) =>
    new UpdatePagePublicationSettingsHandler(
      publicationRepo,
      siteRepo,
      transaction,
      tree,
      availability,
    ).execute(
      new UpdatePagePublicationSettingsCommand(
        'user',
        page.getId(),
        siteId,
        includeDescendants,
      ),
    );
  const publicRead = (path: string) =>
    new GetPublicPageHandler(
      siteRepo,
      publicationRepo,
      { findByPageId: async () => [] } as unknown as PageBlockRepository,
      availability,
    ).execute(new GetPublicPageQuery('asss', path));
  beforeEach(async () => {
    sites = new Map();
    publications = new Map();
    pages = new Map();
    home = Page.create({
      workspaceId: 'workspace',
      title: 'Home',
      createdBy: 'user',
    });
    about = Page.create({
      workspaceId: 'workspace',
      title: 'About',
      createdBy: 'user',
    });
    docs = Page.create({
      workspaceId: 'workspace',
      title: 'Docs',
      createdBy: 'user',
    });
    [home, about, docs].forEach((page) => pages.set(page.getId(), page));
    authorize.mockReset().mockResolvedValue(true);
    siteRepo = {
      findById: async (id: string) => sites.get(id) ?? null,
      findByIdForUpdate: async (id: string) => sites.get(id) ?? null,
      findByRootPageId: async (id: string) =>
        [...sites.values()].find((s) => s.getRootPageId() === id) ?? null,
      existsBySubdomain: async (subdomain: string) =>
        [...sites.values()].some((s) => s.getSubdomain() === subdomain),
      findActiveBySubdomain: async (subdomain: string) =>
        [...sites.values()].find(
          (s) => s.getSubdomain() === subdomain && s.getDisabledAt() === null,
        ) ?? null,
      save: jest.fn(async (value: PublishedSite, ctx: unknown) => {
        expect(ctx).toBe(context);
        sites.set(value.getId(), value);
        return value;
      }),
    } as unknown as PublishedSiteRepository;
    publicationRepo = {
      findById: async (id: string) => publications.get(id) ?? null,
      findByPageId: async (id: string) =>
        [...publications.values()].filter((p) => p.getPageId() === id),
      findBySiteId: async (id: string) =>
        [...publications.values()].filter((p) => p.getSiteId() === id),
      findBySiteAndPage: async (sid: string, pid: string) =>
        [...publications.values()].find(
          (p) => p.getSiteId() === sid && p.getPageId() === pid,
        ) ?? null,
      findBySiteAndPath: async (sid: string, path: string) =>
        [...publications.values()].find(
          (p) => p.getSiteId() === sid && p.getPath() === path,
        ) ?? null,
      findActiveBySiteAndPath: async (sid: string, path: string) =>
        [...publications.values()].find(
          (p) =>
            p.getSiteId() === sid &&
            p.getPath() === path &&
            p.getUnpublishedAt() === null,
        ) ?? null,
      save: jest.fn(async (value: PagePublication, ctx: unknown) => {
        expect(ctx).toBe(context);
        publications.set(value.getId(), value);
        return value;
      }),
    } as unknown as PagePublicationRepository;
    pageRepo = {
      lockWorkspaceHierarchy: async () => undefined,
      findById: async (id: string) => pages.get(id) ?? null,
      findDescendants: async (id: string) => {
        const descendants: Page[] = [];
        const visit = (parentId: string) => {
          for (const child of pages.values()) {
            if (
              child.getParentPageId() === parentId &&
              child.getDeletedAt() === null
            ) {
              descendants.push(child);
              visit(child.getId());
            }
          }
        };
        visit(id);
        return descendants;
      },
      existsBySlug: async (workspaceId: string, slug: string) =>
        [...pages.values()].some(
          (page) =>
            page.getWorkspaceId() === workspaceId &&
            page.getSlug() === slug &&
            page.getDeletedAt() === null,
        ),
      save: async (page: Page, ctx: unknown) => {
        expect(ctx).toBe(context);
        pages.set(page.getId(), page);
        return page;
      },
    } as unknown as PageRepository;
    tree = new PagePublicationTreeService(pageRepo, publicationRepo, siteRepo);
    availability = new PublicationAvailabilityService(
      pageRepo,
      publicationRepo,
      workspaceRepo,
    );
    await new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
      tree,
    ).execute(new PublishSiteCommand('user', home.getId(), 'asss'));
    site = [...sites.values()].pop()!;
  });
  it('preserves root creation and resolves Home', async () => {
    expect(site.getRootPageId()).toBe(home.getId());
    expect((await publicRead('/')).page.title).toBe('Home');
  });
  it('publishes About and Docs into the existing site and lists effective status', async () => {
    expect((await additional(about, 'about/')).path).toBe('/about');
    expect((await additional(docs, '/docs/')).path).toBe('/docs');
    expect(sites.size).toBe(1);
    expect((await publicRead('/about')).page.title).toBe('About');
    expect(
      await new ListSitePublicationsHandler(
        siteRepo,
        publicationRepo,
        authorization,
        availability,
      ).execute(site.getId(), 'user'),
    ).toHaveLength(3);
  });
  it.each(['/', '//', '/../', '/./', '/a//b', '/%2e%2e/', '/a?x', '/a#x'])(
    'rejects invalid/reserved path %s',
    async (path) => {
      await expect(additional(about, path)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );
  it('rejects duplicate paths and duplicate pages including unpublished records', async () => {
    await additional(about, '/about');
    await expect(additional(docs, '/about/')).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(additional(about, '/team')).rejects.toBeInstanceOf(
      ConflictException,
    );
    await unpublish(about);
    await expect(additional(about, '/team')).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(additional(docs, '/about')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('rejects a different workspace', async () => {
    const other = Page.create({
      workspaceId: 'other',
      title: 'Other',
      createdBy: 'user',
    });
    pages.set(other.getId(), other);
    await expect(additional(other, '/other')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it('rejects missing/deleted pages and disabled sites', async () => {
    pages.delete(about.getId());
    await expect(additional(about, '/about')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    pages.set(about.getId(), about);
    about.markAsDeleted('user');
    await expect(additional(about, '/about')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    site.disable();
    await expect(additional(docs, '/docs')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it('requires PAGE_UPDATE on both destination root and additional page', async () => {
    authorize.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(additional(about, '/about')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(publications.size).toBe(1);
  });
  it('unpublishes only About while Home and Docs stay available', async () => {
    await additional(about, '/about');
    await additional(docs, '/docs');
    await unpublish(about);
    expect(site.getDisabledAt()).toBeNull();
    await expect(publicRead('/about')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect((await publicRead('/')).page.title).toBe('Home');
    expect((await publicRead('/docs')).page.title).toBe('Docs');
  });
  it('root lifecycle gates all paths and non-root republish never enables the site', async () => {
    await additional(about, '/about');
    await additional(docs, '/docs');
    const original = await publicationRepo.findBySiteAndPage(
      site.getId(),
      about.getId(),
    );
    await unpublish(about);
    await unpublish(home);
    for (const path of ['/', '/about', '/docs'])
      await expect(publicRead(path)).rejects.toBeInstanceOf(NotFoundException);
    await expect(republish(about)).rejects.toBeInstanceOf(BadRequestException);
    expect(site.getDisabledAt()).not.toBeNull();
    expect(original?.getUnpublishedAt()).not.toBeNull();
    expect(original?.getPath()).toBe('/about');
    await republish(home);
    await republish(about);
    expect(site.getDisabledAt()).toBeNull();
    expect((await publicRead('/about')).page.title).toBe('About');
    expect(publications.size).toBe(3);
  });
  it('refuses ambiguous page-only selection and resolves explicit site', async () => {
    await additional(about, '/about');
    const extra = PagePublication.create({
      siteId: 'other-site',
      pageId: about.getId(),
      path: '/other',
      parentPublicationId: 'other-root',
      publishedBy: 'user',
    });
    publications.set(extra.getId(), extra);
    await expect(
      resolvePagePublication(publicationRepo, about.getId()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      (
        await resolvePagePublication(
          publicationRepo,
          about.getId(),
          site.getId(),
        )
      )?.getPath(),
    ).toBe('/about');
  });
  it('republishes a non-root record without changing an enabled site', async () => {
    await additional(about, '/about');
    await unpublish(about);
    await republish(about);
    expect(site.getDisabledAt()).toBeNull();
    expect((await publicRead('/about')).page.title).toBe('About');
    expect(publications.size).toBe(2);
  });
  it('returns conflict for a concurrent database uniqueness violation', async () => {
    // The repository save double is a standalone jest.fn and does not use this.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    jest.mocked(publicationRepo.save).mockRejectedValueOnce({
      driverError: {
        code: '23505',
        constraint: 'UQ_page_publications_site_path',
      },
    });
    await expect(additional(about, '/about')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('rejects a missing site and unauthorized site listing', async () => {
    sites.clear();
    await expect(additional(about, '/about')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    sites.set(site.getId(), site);
    authorize.mockResolvedValue(false);
    await expect(
      new ListSitePublicationsHandler(
        siteRepo,
        publicationRepo,
        authorization,
        availability,
      ).execute(site.getId(), 'user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  const child = (parent: Page, title: string) => {
    const page = Page.create({
      workspaceId: parent.getWorkspaceId(),
      title,
      parentPageId: parent.getId(),
      createdBy: 'user',
    });
    pages.set(page.getId(), page);
    return page;
  };
  const publishRoot = async (includeDescendants: boolean) => {
    sites.clear();
    publications.clear();
    await new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
      tree,
    ).execute(
      new PublishSiteCommand('user', home.getId(), 'asss', includeDescendants),
    );
    site = [...sites.values()][0];
  };
  const createChild = (
    parent: Page,
    title: string,
    transaction: UnitOfWork = uow,
  ) =>
    new CreatePageHandler(pageRepo, authorization, transaction, tree).execute(
      new CreatePageCommand(
        'user',
        parent.getWorkspaceId(),
        title,
        undefined,
        parent.getId(),
      ),
    );

  it('enables inheritance on an existing DIRECT root and serves nested pages', async () => {
    const aboutPage = child(home, 'About');
    const docsPage = child(home, 'Docs');
    const api = child(docsPage, 'API');
    const root = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      home.getId(),
    ))!;
    const response = await updateSettings(home, true);
    expect(response).toMatchObject({
      id: root.getId(),
      path: '/',
      publication_type: PagePublicationType.DIRECT,
      include_descendants: true,
      published: true,
    });
    for (const [page, path, parentId] of [
      [aboutPage, '/about', root.getId()],
      [docsPage, '/docs', root.getId()],
      [
        api,
        '/docs/api',
        (await publicationRepo.findBySiteAndPage(
          site.getId(),
          docsPage.getId(),
        ))!.getId(),
      ],
    ] as const) {
      const publication = await publicationRepo.findBySiteAndPage(
        site.getId(),
        page.getId(),
      );
      expect(publication?.getPath()).toBe(path);
      expect(publication?.getPublicationType()).toBe(
        PagePublicationType.INHERITED,
      );
      expect(publication?.getParentPublicationId()).toBe(parentId);
      expect((await publicRead(path)).page.id).toBe(page.getId());
    }
    const ids = [...publications.keys()];
    await updateSettings(home, true);
    expect([...publications.keys()]).toEqual(ids);
  });

  it('disables only inherited descendants and can revive them', async () => {
    const inherited = child(home, 'About');
    const nested = child(inherited, 'Team');
    const independent = child(home, 'Docs');
    await additional(independent, '/documentation');
    await updateSettings(home, true);
    const inheritedId = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      inherited.getId(),
    ))!.getId();
    const nestedId = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      nested.getId(),
    ))!.getId();
    const directId = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      independent.getId(),
    ))!.getId();
    const response = await updateSettings(home, false);
    expect(response).toMatchObject({
      include_descendants: false,
      published: true,
    });
    expect(
      (await publicationRepo.findById(inheritedId))?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(
      (await publicationRepo.findById(nestedId))?.getUnpublishedAt(),
    ).not.toBeNull();
    expect(
      (await publicationRepo.findById(directId))?.getUnpublishedAt(),
    ).toBeNull();
    expect((await publicRead('/documentation')).page.id).toBe(
      independent.getId(),
    );
    await expect(publicRead('/about')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await updateSettings(home, true);
    expect(
      (await publicationRepo.findById(inheritedId))?.getUnpublishedAt(),
    ).toBeNull();
    expect(
      (await publicationRepo.findById(nestedId))?.getUnpublishedAt(),
    ).toBeNull();
  });

  it('rejects settings changes while the site is disabled or publication unpublished', async () => {
    await unpublish(home);
    await expect(updateSettings(home, true)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await republish(home);
    await additional(docs, '/docs');
    await unpublish(docs);
    await expect(updateSettings(docs, true)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each([false, true])(
    'preserves independent DIRECT path and branch (include=%s)',
    async (include) => {
      const directPage = child(home, 'Docs');
      const api = child(directPage, 'API');
      await additional(directPage, '/documentation', include);
      await updateSettings(home, true);
      const direct = await publicationRepo.findBySiteAndPage(
        site.getId(),
        directPage.getId(),
      );
      expect(direct?.getPath()).toBe('/documentation');
      expect(direct?.getPublicationType()).toBe(PagePublicationType.DIRECT);
      expect(
        (
          await publicationRepo.findBySiteAndPage(site.getId(), api.getId())
        )?.getPath(),
      ).toBe(include ? '/documentation/api' : undefined);
    },
  );

  it('rejects INHERITED settings updates', async () => {
    const inherited = child(home, 'About');
    await updateSettings(home, true);
    await expect(updateSettings(inherited, false)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('targets only the selected site and rejects ambiguous omission', async () => {
    child(home, 'About');
    await new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
      tree,
    ).execute(new PublishSiteCommand('user', home.getId(), 'second-site'));
    const second = [...sites.values()].find(
      (entry) => entry.getId() !== site.getId(),
    )!;
    await expect(
      new UpdatePagePublicationSettingsHandler(
        publicationRepo,
        siteRepo,
        uow,
        tree,
        availability,
      ).execute(
        new UpdatePagePublicationSettingsCommand(
          'user',
          home.getId(),
          undefined,
          true,
        ),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await updateSettings(home, true, site.getId());
    expect(
      (
        await publicationRepo.findBySiteAndPage(site.getId(), home.getId())
      )?.getIncludeDescendants(),
    ).toBe(true);
    expect(
      (
        await publicationRepo.findBySiteAndPage(second.getId(), home.getId())
      )?.getIncludeDescendants(),
    ).toBe(false);
  });

  it('rolls back the setting if reconciliation fails', async () => {
    child(home, 'About');
    const saved = new Map(
      [...publications].map(([id, value]) => [id, snapshot(value)]),
    );
    const transaction: UnitOfWork = {
      runInTransaction: async (fn) => {
        try {
          return await fn(context);
        } catch (error) {
          publications.clear();
          for (const [id, value] of saved) publications.set(id, value);
          throw error;
        }
      },
    };
    publicationRepo.save = jest.fn(async (value, ctx) => {
      if (value.getPublicationType() === PagePublicationType.INHERITED)
        throw new Error('reconciliation failed');
      expect(ctx).toBe(context);
      publications.set(value.getId(), value);
      return value;
    });
    await expect(
      updateSettings(home, true, site.getId(), transaction),
    ).rejects.toThrow('reconciliation failed');
    expect(
      (
        await publicationRepo.findBySiteAndPage(site.getId(), home.getId())
      )?.getIncludeDescendants(),
    ).toBe(false);
    expect(publications.size).toBe(1);
  });

  it('publishes only the root when descendants are false (default)', async () => {
    child(home, 'About');
    child(home, 'Docs');
    await publishRoot(false);
    expect(publications.size).toBe(1);
    const root = [...publications.values()][0];
    expect(root.getPublicationType()).toBe(PagePublicationType.DIRECT);
    expect(root.getParentPublicationId()).toBeNull();
    expect(root.getIncludeDescendants()).toBe(false);
  });

  it('publishes root descendants as a nested, parent-linked tree', async () => {
    child(home, 'About');
    const documentation = child(home, 'Docs');
    const api = child(documentation, 'API');
    child(api, 'Authentication');
    await publishRoot(true);
    expect(
      [...publications.values()].map((entry) => entry.getPath()).sort(),
    ).toEqual([
      '/',
      '/about',
      '/docs',
      '/docs/api',
      '/docs/api/authentication',
    ]);
    const read = await publicRead('/docs/api/authentication');
    expect(read.breadcrumbs.map((entry) => entry.title)).toEqual([
      'Home',
      'Docs',
      'API',
      'Authentication',
    ]);
    expect(read.breadcrumbs.map((entry) => entry.path)).toEqual([
      '/',
      '/docs',
      '/docs/api',
      '/docs/api/authentication',
    ]);
    expect(
      [...publications.values()].filter(
        (entry) => entry.getPublicationType() === PagePublicationType.INHERITED,
      ),
    ).toHaveLength(4);
  });

  it('allocates deterministic suffixes without overwriting reserved inactive paths', async () => {
    child(docs, 'API');
    child(docs, 'API');
    await additional(docs, '/docs', true);
    expect(publications.size).toBe(4);
    expect((await publicRead('/docs/api-2')).page.title).toBe('API');
    await unpublish(docs);
    await republish(docs);
    expect(publications.size).toBe(4);
    await createChild(docs, 'API');
    expect((await publicRead('/docs/api-3')).page.title).toBe('API');
  });

  it('reuses Vietnamese slug generation', async () => {
    child(docs, 'Hướng dẫn bắt đầu');
    await additional(docs, '/docs', true);
    expect((await publicRead('/docs/huong-dan-bat-dau')).page.title).toBe(
      'Hướng dẫn bắt đầu',
    );
  });

  it('uses live renamed titles while keeping persisted URLs and breadcrumb paths', async () => {
    const start = child(docs, 'Getting Started');
    await additional(docs, '/docs', true);
    start.update({ title: 'Quick Start' });
    docs.update({ title: 'Documentation' });
    const read = await publicRead('/docs/getting-started');
    expect(read.breadcrumbs).toEqual([
      { page_id: home.getId(), title: 'Home', path: '/' },
      { page_id: docs.getId(), title: 'Documentation', path: '/docs' },
      {
        page_id: start.getId(),
        title: 'Quick Start',
        path: '/docs/getting-started',
      },
    ]);
  });

  it('auto-publishes newly created children and grandchildren', async () => {
    await additional(docs, '/docs', true);
    const created = await createChild(docs, 'API');
    const api = pages.get(created.id)!;
    await createChild(api, 'Authentication');
    expect(
      (await publicRead('/docs/api/authentication')).breadcrumbs.map(
        (entry) => entry.title,
      ),
    ).toEqual(['Home', 'Docs', 'API', 'Authentication']);
  });

  it('does not inherit from a DIRECT publication without descendants', async () => {
    await additional(docs, '/docs');
    await createChild(docs, 'API');
    expect(publications.size).toBe(2);
  });

  it('does not inherit from unpublished parents or disabled sites', async () => {
    await additional(docs, '/docs', true);
    await unpublish(docs);
    await createChild(docs, 'API');
    await republish(docs);
    await unpublish(home);
    await createChild(docs, 'Guide');
    expect(
      [...publications.values()].some(
        (entry) => entry.getPath() === '/docs/guide',
      ),
    ).toBe(false);
    await republish(home);
    expect(site.getDisabledAt()).toBeNull();
  });

  it('allows the same page in different sites and inherits into all active sites', async () => {
    await additional(docs, '/docs', true);
    await new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
      tree,
    ).execute(
      new PublishSiteCommand('user', docs.getId(), 'documentation', true),
    );
    const created = await createChild(docs, 'API');
    const inherited = await publicationRepo.findByPageId(created.id);
    expect(inherited.map((entry) => entry.getPath()).sort()).toEqual([
      '/api',
      '/docs/api',
    ]);
    expect(new Set(inherited.map((entry) => entry.getSiteId())).size).toBe(2);
    const listed = await new ListPagePublicationsHandler(
      publicationRepo,
      siteRepo,
      availability,
    ).execute(docs.getId());
    expect(listed).toHaveLength(2);
    expect(
      listed.every(
        (entry) =>
          entry.include_descendants &&
          entry.publication_type === PagePublicationType.DIRECT,
      ),
    ).toBe(true);
    await expect(additional(docs, '/duplicate')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('allows the same page to be the root of multiple sites', async () => {
    await new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
      tree,
    ).execute(new PublishSiteCommand('user', home.getId(), 'second-site'));

    const rootPublications = [...publications.values()].filter(
      (entry) => entry.getPageId() === home.getId(),
    );
    expect(rootPublications).toHaveLength(2);
    expect(
      new Set(rootPublications.map((entry) => entry.getSiteId())).size,
    ).toBe(2);
  });

  it.each([false, true])(
    'preserves existing independent DIRECT descendants (include=%s)',
    async (includeDescendants) => {
      const api = child(docs, 'API');
      child(api, 'Authentication');
      await additional(api, '/reference', includeDescendants);
      await additional(docs, '/docs', true);
      const direct = await publicationRepo.findBySiteAndPage(
        site.getId(),
        api.getId(),
      );
      expect(direct?.getPath()).toBe('/reference');
      expect(direct?.getPublicationType()).toBe(PagePublicationType.DIRECT);
      expect(direct?.getParentPublicationId()).toBe(
        (await publicationRepo.findBySiteAndPath(site.getId(), '/'))?.getId(),
      );
      expect(
        [...publications.values()].some(
          (entry) => entry.getPath() === '/reference/authentication',
        ),
      ).toBe(includeDescendants);
      expect(
        [...publications.values()].some(
          (entry) => entry.getPath() === '/docs/api',
        ),
      ).toBe(false);
      await unpublish(docs);
      expect((await publicRead('/reference')).page.title).toBe('API');
      if (includeDescendants)
        expect((await publicRead('/reference/authentication')).page.title).toBe(
          'Authentication',
        );
    },
  );

  it('soft-unpublishes inherited branches and republish rebuilds the current tree without duplicates', async () => {
    const api = child(docs, 'API');
    child(api, 'Authentication');
    child(docs, 'Guide');
    await additional(docs, '/docs', true);
    await additional(about, '/about');
    const ids = [...publications.keys()];
    await unpublish(docs);
    for (const path of [
      '/docs',
      '/docs/api',
      '/docs/api/authentication',
      '/docs/guide',
    ])
      await expect(publicRead(path)).rejects.toBeInstanceOf(NotFoundException);
    expect((await publicRead('/about')).page.title).toBe('About');
    await createChild(docs, 'New Chapter');
    await republish(docs);
    expect(ids.every((id) => publications.has(id))).toBe(true);
    expect(publications.size).toBe(ids.length + 1);
    expect((await publicRead('/docs/new-chapter')).page.title).toBe(
      'New Chapter',
    );
    expect((await publicRead('/docs/api/authentication')).page.title).toBe(
      'Authentication',
    );
  });

  it('root unpublish disables the site and root republish restores current descendants', async () => {
    const documentation = child(home, 'Docs');
    child(documentation, 'API');
    await publishRoot(true);
    const ids = [...publications.keys()];
    await unpublish(home);
    expect(
      [...publications.values()].every(
        (entry) => entry.getUnpublishedAt() !== null,
      ),
    ).toBe(true);
    await createChild(documentation, 'New');
    await republish(home);
    expect(publications.size).toBe(ids.length + 1);
    expect(ids.every((id) => publications.has(id))).toBe(true);
    expect((await publicRead('/docs/new')).page.title).toBe('New');
  });

  it('rejects deleted pages and missing/cyclic breadcrumb parents', async () => {
    const api = child(docs, 'API');
    await additional(docs, '/docs', true);
    api.markAsDeleted('user');
    await expect(publicRead('/docs/api')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    api.restoreDeleted();
    docs.markAsDeleted('user');
    await expect(publicRead('/docs/api')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    docs.restoreDeleted();
    const parent = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      docs.getId(),
    ))!;
    publications.delete(parent.getId());
    await expect(publicRead('/docs/api')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('validates the entire plan before writing any subtree records', async () => {
    child(docs, 'Good');
    const invalid = child(docs, 'Invalid');
    const spy = jest
      .spyOn(pageRepo, 'findDescendants')
      .mockResolvedValue([
        pages.get(
          [...pages.keys()].find((id) => pages.get(id)?.getTitle() === 'Good')!,
        )!,
        invalid,
        invalid,
      ]);
    await expect(additional(docs, '/docs', true)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(publications.size).toBe(1);
    spy.mockRestore();
  });

  it('rolls back Page creation and publications together when a publication write fails', async () => {
    await additional(docs, '/docs', true);
    const transaction: UnitOfWork = {
      runInTransaction: async (fn) => {
        const previousPages = new Map(pages);
        const previousPublications = new Map(publications);
        try {
          return await fn(context);
        } catch (error) {
          pages = previousPages;
          publications = previousPublications;
          throw error;
        }
      },
    };
    const pageCount = pages.size;
    const publicationCount = publications.size;
    jest
      .spyOn(publicationRepo, 'save')
      .mockRejectedValueOnce(new Error('write failed'));
    await expect(createChild(docs, 'API', transaction)).rejects.toThrow(
      'write failed',
    );
    expect(pages.size).toBe(pageCount);
    expect(publications.size).toBe(publicationCount);
  });

  it('lists inactive publications for lifecycle/republish', async () => {
    await additional(docs, '/docs', true);
    await unpublish(docs);
    const listed = await new ListPagePublicationsHandler(
      publicationRepo,
      siteRepo,
      availability,
    ).execute(docs.getId());
    expect(listed[0].published).toBe(false);
    expect(listed[0].unpublished_at).toBeInstanceOf(Date);
    expect(listed[0].include_descendants).toBe(true);
  });

  it('rejects singular GET, DELETE and republish ambiguity including a root in three sites', async () => {
    await additional(docs, '/docs');
    await new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
      tree,
    ).execute(new PublishSiteCommand('user', docs.getId(), 'docs-root'));
    const other = PublishedSite.create({
      workspaceId: 'workspace',
      rootPageId: about.getId(),
      subdomain: 'third',
      createdBy: 'user',
    });
    sites.set(other.getId(), other);
    const root = PagePublication.create({
      siteId: other.getId(),
      pageId: about.getId(),
      path: '/',
      publishedBy: 'user',
    });
    publications.set(root.getId(), root);
    const third = PagePublication.create({
      siteId: other.getId(),
      pageId: docs.getId(),
      path: '/guide',
      parentPublicationId: root.getId(),
      publishedBy: 'user',
    });
    publications.set(third.getId(), third);
    const get = new GetPagePublicationHandler(
      publicationRepo,
      siteRepo,
      availability,
    );
    await expect(
      get.execute(new GetPagePublicationQuery(docs.getId())),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      new UnpublishSiteHandler(publicationRepo, siteRepo, uow, tree).execute(
        new UnpublishSiteCommand('user', docs.getId()),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      new RepublishSiteHandler(publicationRepo, siteRepo, uow, tree).execute(
        new RepublishSiteCommand('user', docs.getId()),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      (
        await get.execute(
          new GetPagePublicationQuery(docs.getId(), site.getId()),
        )
      ).path,
    ).toBe('/docs');
    expect(
      await new ListPagePublicationsHandler(
        publicationRepo,
        siteRepo,
        availability,
      ).execute(docs.getId()),
    ).toHaveLength(3);
    await unpublish(docs);
    expect(third.getUnpublishedAt()).toBeNull();
    await republish(docs);
    expect(third.getUnpublishedAt()).toBeNull();
  });

  it('preserves zero/single publication resolution and explicit site selection', async () => {
    expect(
      await resolvePagePublication(publicationRepo, docs.getId()),
    ).toBeNull();
    await additional(docs, '/docs');
    expect(
      (
        await resolvePagePublication(publicationRepo, docs.getId())
      )?.getSiteId(),
    ).toBe(site.getId());
    expect(
      await resolvePagePublication(publicationRepo, docs.getId(), 'missing'),
    ).toBeNull();
  });

  it('rejects standalone INHERITED republish without activating the child or ancestors', async () => {
    const api = child(docs, 'API');
    await additional(docs, '/docs', true);
    await unpublish(docs);
    await expect(republish(api)).rejects.toBeInstanceOf(ConflictException);
    expect(
      (
        await publicationRepo.findBySiteAndPage(site.getId(), api.getId())
      )?.getUnpublishedAt(),
    ).not.toBeNull();
    await expect(publicRead('/docs/api')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reloads unpublish state after acquiring the site lock', async () => {
    await additional(docs, '/docs');
    const publication = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      docs.getId(),
    ))!;
    jest
      .spyOn(publicationRepo, 'findBySiteAndPage')
      .mockResolvedValueOnce(snapshot(publication));
    jest.spyOn(siteRepo, 'findByIdForUpdate').mockImplementation(async () => {
      publication.unpublish();
      return site;
    });
    await expect(unpublish(docs)).rejects.toThrow('already unpublished');
  });

  it('reloads republish state after acquiring the site lock', async () => {
    await additional(docs, '/docs');
    await unpublish(docs);
    const publication = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      docs.getId(),
    ))!;
    jest
      .spyOn(publicationRepo, 'findBySiteAndPage')
      .mockResolvedValueOnce(snapshot(publication));
    jest.spyOn(siteRepo, 'findByIdForUpdate').mockImplementation(async () => {
      publication.republish('other');
      return site;
    });
    await expect(republish(docs)).rejects.toThrow('already published');
  });

  it('reconciles independent DIRECT descendants when a non-inheriting root is republished', async () => {
    await additional(docs, '/docs', true);
    await unpublish(home);
    await createChild(docs, 'API');
    await republish(home);
    expect((await publicRead('/docs/api')).page.title).toBe('API');
    expect(publications.size).toBe(3);
  });

  it('does not block root republish on a deleted independent DIRECT branch', async () => {
    await additional(docs, '/docs', true);
    docs.markAsDeleted('user');
    await unpublish(home);
    await republish(home);
    expect((await publicRead('/')).page.title).toBe('Home');
    await expect(publicRead('/docs')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechecks singular ambiguity when a new publication appears while waiting for the workspace lock', async () => {
    const root = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      home.getId(),
    ))!;
    jest
      .spyOn(pageRepo, 'lockWorkspaceHierarchy')
      .mockImplementation(async () => {
        const extra = PagePublication.create({
          siteId: 'concurrent-site',
          pageId: home.getId(),
          path: '/',
          publishedBy: 'user',
        });
        publications.set(extra.getId(), extra);
      });
    await expect(
      new UnpublishSiteHandler(publicationRepo, siteRepo, uow, tree).execute(
        new UnpublishSiteCommand('user', home.getId()),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(root.getUnpublishedAt()).toBeNull();
  });

  it('duplicates children through the same inheritance hook', async () => {
    const api = child(docs, 'API');
    await additional(docs, '/docs', true);
    const blocks = {
      findByPageId: async () => [],
    } as unknown as PageBlockRepository;
    const result = await new DuplicatePageHandler(
      pageRepo,
      blocks,
      uow,
      tree,
    ).execute(new DuplicatePageCommand('user', 'workspace', api.getId()));
    expect(
      (
        await publicationRepo.findBySiteAndPage(site.getId(), result.id)
      )?.getPublicationType(),
    ).toBe(PagePublicationType.INHERITED);
    expect((await publicRead('/docs/api-copy')).page.id).toBe(result.id);
  });

  it('rejects orphan, cross-site and cyclic public parent chains and reports unavailable status', async () => {
    const api = child(docs, 'API');
    await additional(docs, '/docs', true);
    const publication = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      api.getId(),
    ))!;
    const parentGetter = jest
      .spyOn(publication, 'getParentPublicationId')
      .mockReturnValue(null);
    await expect(publicRead('/docs/api')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(
      (
        await new ListPagePublicationsHandler(
          publicationRepo,
          siteRepo,
          availability,
        ).execute(api.getId())
      )[0].published,
    ).toBe(false);
    parentGetter.mockReturnValue(publication.getId());
    await expect(publicRead('/docs/api')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    parentGetter.mockRestore();
    const parent = (await publicationRepo.findBySiteAndPage(
      site.getId(),
      docs.getId(),
    ))!;
    jest.spyOn(parent, 'getSiteId').mockReturnValue('another-site');
    await expect(publicRead('/docs/api')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects cross-site parents in publication planning', async () => {
    const foreign = PagePublication.create({
      siteId: 'foreign',
      pageId: about.getId(),
      path: '/',
      publishedBy: 'user',
    });
    publications.set(foreign.getId(), foreign);
    const direct = PagePublication.create({
      siteId: site.getId(),
      pageId: docs.getId(),
      path: '/docs',
      parentPublicationId: foreign.getId(),
      publishedBy: 'user',
    });
    await expect(
      tree.buildPlan(site, direct, 'user', context),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a root path belonging to the wrong root Page', async () => {
    const root = (await publicationRepo.findBySiteAndPath(site.getId(), '/'))!;
    jest.spyOn(root, 'getPageId').mockReturnValue(about.getId());
    await expect(publicRead('/')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports effective availability for deleted Pages, ancestors and Workspaces', async () => {
    const api = child(docs, 'API');
    await additional(docs, '/docs', true);
    const get = new GetPagePublicationHandler(
      publicationRepo,
      siteRepo,
      availability,
    );
    docs.markAsDeleted('user');
    expect(
      (
        await get.execute(
          new GetPagePublicationQuery(api.getId(), site.getId()),
        )
      ).published,
    ).toBe(false);
    docs.restoreDeleted();
    jest.spyOn(workspaceRepo, 'findById').mockResolvedValueOnce(null);
    expect(
      (
        await get.execute(
          new GetPagePublicationQuery(api.getId(), site.getId()),
        )
      ).published,
    ).toBe(false);
  });

  it('allocates deterministic Page slugs independently of publication paths', async () => {
    await additional(docs, '/custom', true);
    const first = await createChild(docs, 'API');
    const second = await createChild(docs, 'API');
    expect(pages.get(first.id)?.getSlug()).toBe('api');
    expect(pages.get(second.id)?.getSlug()).toBe('api-2');
    expect((await publicRead('/custom/api-2')).page.id).toBe(second.id);
  });
});
