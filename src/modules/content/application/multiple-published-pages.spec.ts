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
import { GetPublicPageHandler } from './queries/page-publication/get-public-page/get-public-page.handler';
import { GetPublicPageQuery } from './queries/page-publication/get-public-page/get-public-page.query';
import { ListSitePublicationsHandler } from './queries/page-publication/list-site-publications/list-site-publications.handler';
import { resolvePagePublication } from './services/resolve-page-publication';

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
  const context = {};
  const uow: UnitOfWork = { runInTransaction: (fn) => fn(context) };
  const authorize = jest.fn();
  const authorization = { authorize } as unknown as AuthorizationService;
  const additional = (page: Page, path: string) =>
    new PublishPageToSiteHandler(
      siteRepo,
      pageRepo,
      publicationRepo,
      uow,
      authorization,
    ).execute(
      new PublishPageToSiteCommand('user', site.getId(), page.getId(), path),
    );
  const unpublish = (page: Page) =>
    new UnpublishSiteHandler(publicationRepo, siteRepo, uow).execute(
      new UnpublishSiteCommand('user', page.getId(), site.getId()),
    );
  const republish = (page: Page) =>
    new RepublishSiteHandler(publicationRepo, siteRepo, uow).execute(
      new RepublishSiteCommand('user', page.getId(), site.getId()),
    );
  const publicRead = (path: string) =>
    new GetPublicPageHandler(
      siteRepo,
      publicationRepo,
      pageRepo,
      { findByPageId: async () => [] } as unknown as PageBlockRepository,
      { findById: async () => ({}) } as unknown as WorkspaceRepository,
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
      findById: async (id: string) => pages.get(id) ?? null,
    } as unknown as PageRepository;
    await new PublishSiteHandler(
      pageRepo,
      siteRepo,
      publicationRepo,
      uow,
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
    await republish(about);
    expect(site.getDisabledAt()).not.toBeNull();
    expect(original?.getUnpublishedAt()).toBeNull();
    expect(original?.getPath()).toBe('/about');
    await republish(home);
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
      ).execute(site.getId(), 'user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
