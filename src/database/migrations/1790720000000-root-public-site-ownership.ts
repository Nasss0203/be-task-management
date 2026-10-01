import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

type SiteRow = {
  id: string;
  root_page_id: string;
  subdomain: string;
  workspace_id: string;
};
type PublicationRow = {
  id: string;
  page_id: string;
  path: string;
  parent_publication_id: string | null;
  publication_type: string;
  include_descendants: boolean;
  unpublished_at: Date | null;
  published_by: string;
};
type ChildRow = { id: string; slug: string | null; title: string };

export class RootPublicSiteOwnership1790720000000 implements MigrationInterface {
  name = 'RootPublicSiteOwnership1790720000000';

  private async rows<T>(
    runner: QueryRunner,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return (await runner.query(sql, params)) as unknown as T[];
  }

  async up(runner: QueryRunner): Promise<void> {
    const conflicts = await this.rows<{ id: string }>(
      runner,
      `
      SELECT s.root_page_id AS id FROM published_sites s
      JOIN pages p ON p.id = s.root_page_id
      WHERE p.parent_page_id IS NULL
      GROUP BY s.root_page_id HAVING count(*) > 1
      UNION ALL
      SELECT s.id FROM published_sites s JOIN pages p ON p.id = s.root_page_id
      WHERE s.workspace_id <> p.workspace_id
      UNION ALL
      SELECT s.id FROM published_sites s WHERE NOT EXISTS (
        SELECT 1 FROM page_publications pp
        WHERE pp.site_id = s.id AND pp.path = '/' AND pp.page_id = s.root_page_id
      )
      UNION ALL
      SELECT pp.id FROM page_publications pp
      JOIN published_sites s ON s.id=pp.site_id
      JOIN pages root ON root.id=s.root_page_id
      WHERE root.parent_page_id IS NULL AND s.disabled_at IS NULL
        AND pp.path<>'/' AND pp.publication_type='DIRECT' AND pp.unpublished_at IS NULL
    `,
    );
    if (conflicts.length)
      throw new Error(
        'Root ownership preflight failed: multiple root sites, workspace mismatch, missing root publication, or active non-root DIRECT publication',
      );

    // Keep historical rows and exact prior lifecycle state for a reversible down.
    await runner.query(`CREATE TABLE publication_root_ownership_site_backup (
      site_id uuid PRIMARY KEY, disabled_at timestamptz, updated_at timestamptz
    )`);
    await runner.query(`CREATE TABLE publication_root_ownership_publication_backup (
      publication_id uuid PRIMARY KEY, unpublished_at timestamptz,
      published_at timestamptz, updated_at timestamptz, published_by uuid
    )`);
    await runner.query(`CREATE TABLE publication_root_ownership_created_publications (
      publication_id uuid PRIMARY KEY
    )`);
    await runner.query(`INSERT INTO publication_root_ownership_site_backup
      SELECT s.id, s.disabled_at, s.updated_at FROM published_sites s
      JOIN pages p ON p.id = s.root_page_id WHERE p.parent_page_id IS NOT NULL`);
    await runner.query(`INSERT INTO publication_root_ownership_publication_backup
      SELECT id, unpublished_at, published_at, updated_at, published_by FROM page_publications`);
    await runner.query(`UPDATE page_publications pp SET unpublished_at = COALESCE(pp.unpublished_at, now()), updated_at = now()
      FROM publication_root_ownership_site_backup b WHERE pp.site_id = b.site_id`);
    await runner.query(`UPDATE published_sites s SET disabled_at = COALESCE(s.disabled_at, now()), updated_at = now()
      FROM publication_root_ownership_site_backup b WHERE s.id = b.site_id`);

    await runner.query(
      `ALTER TABLE pages ADD COLUMN public_subdomain varchar(63)`,
    );
    const siteRoots = await this.rows<SiteRow>(
      runner,
      `SELECT s.id,s.root_page_id,s.subdomain,s.workspace_id
      FROM published_sites s JOIN pages p ON p.id=s.root_page_id
      WHERE p.parent_page_id IS NULL ORDER BY s.created_at,s.id`,
    );
    for (const site of siteRoots) {
      await runner.query(`UPDATE pages SET public_subdomain=$1 WHERE id=$2`, [
        site.subdomain,
        site.root_page_id,
      ]);
    }

    const roots = await this.rows<{
      id: string;
      slug: string | null;
      title: string;
    }>(
      runner,
      `SELECT id,slug,title FROM pages WHERE parent_page_id IS NULL AND public_subdomain IS NULL ORDER BY created_at,id`,
    );
    const reserved = new Set([
      'www',
      'api',
      'app',
      'admin',
      'dashboard',
      'auth',
      'static',
      'assets',
      'cdn',
      'mail',
      'support',
    ]);
    const existing = await this.rows<{ subdomain: string }>(
      runner,
      `SELECT subdomain FROM published_sites UNION SELECT public_subdomain AS subdomain FROM pages WHERE public_subdomain IS NOT NULL`,
    );
    const used = new Set(existing.map((row) => row.subdomain));
    for (const root of roots) {
      const base =
        (root.slug ?? root.title)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 63)
          .replace(/-+$/g, '') || 'page';
      let candidate = '';
      for (let suffix = 1; suffix <= 10000; suffix++) {
        const ending = suffix === 1 ? '' : `-${suffix}`;
        candidate = `${base.slice(0, 63 - ending.length).replace(/-+$/g, '')}${ending}`;
        if (!used.has(candidate) && !reserved.has(candidate)) break;
        candidate = '';
      }
      if (!candidate)
        throw new Error('Public subdomain backfill limit exceeded');
      used.add(candidate);
      await runner.query(`UPDATE pages SET public_subdomain=$1 WHERE id=$2`, [
        candidate,
        root.id,
      ]);
    }
    await runner.query(`ALTER TABLE pages ADD CONSTRAINT CK_pages_public_subdomain_root
      CHECK ((parent_page_id IS NULL) = (public_subdomain IS NOT NULL))`);
    await runner.query(
      `CREATE UNIQUE INDEX UQ_pages_public_subdomain ON pages (public_subdomain)`,
    );
    await runner.query(`CREATE FUNCTION check_page_public_site_ownership() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN
        IF NEW.public_subdomain IS NOT NULL AND EXISTS (
          SELECT 1 FROM published_sites s WHERE s.subdomain=NEW.public_subdomain AND s.root_page_id<>NEW.id
        ) THEN RAISE EXCEPTION 'Public subdomain is reserved by a historical site'; END IF;
        IF EXISTS (SELECT 1 FROM published_sites s WHERE s.root_page_id=NEW.id AND s.disabled_at IS NULL
          AND (NEW.parent_page_id IS NOT NULL OR NEW.public_subdomain IS DISTINCT FROM s.subdomain))
        THEN RAISE EXCEPTION 'Active PublishedSite requires a matching root Page reservation'; END IF;
        RETURN NEW;
      END $$`);
    await runner.query(`CREATE CONSTRAINT TRIGGER TR_pages_public_site_ownership
      AFTER INSERT OR UPDATE OF parent_page_id,public_subdomain ON pages
      DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_page_public_site_ownership()`);
    await runner.query(`CREATE FUNCTION check_site_root_ownership() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN
        IF EXISTS (SELECT 1 FROM pages p WHERE p.public_subdomain=NEW.subdomain AND p.id<>NEW.root_page_id)
        THEN RAISE EXCEPTION 'PublishedSite subdomain is reserved by another Page'; END IF;
        IF NEW.disabled_at IS NULL AND NOT EXISTS (
          SELECT 1 FROM pages p WHERE p.id=NEW.root_page_id AND p.parent_page_id IS NULL
            AND p.public_subdomain=NEW.subdomain
        ) THEN RAISE EXCEPTION 'Active PublishedSite requires a matching root Page reservation'; END IF;
        RETURN NEW;
      END $$`);
    await runner.query(`CREATE CONSTRAINT TRIGGER TR_site_root_ownership
      AFTER INSERT OR UPDATE OF subdomain,root_page_id,disabled_at ON published_sites
      DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_site_root_ownership()`);

    // Reconcile child publications only below active root publications that inherit.
    const activeSites = await this.rows<
      SiteRow & {
        root_id: string;
        include_descendants: boolean;
        unpublished_at: Date | null;
        published_by: string;
      }
    >(
      runner,
      `SELECT s.id,s.root_page_id,s.subdomain,s.workspace_id,pp.id AS root_id,
        pp.include_descendants,pp.unpublished_at,pp.published_by
       FROM published_sites s JOIN page_publications pp ON pp.site_id=s.id AND pp.path='/'
       WHERE s.disabled_at IS NULL ORDER BY s.id`,
    );
    for (const site of activeSites) {
      if (site.unpublished_at !== null || !site.include_descendants) {
        await runner.query(
          `UPDATE page_publications SET unpublished_at=COALESCE(unpublished_at,now()), updated_at=now()
          WHERE site_id=$1 AND publication_type='INHERITED'`,
          [site.id],
        );
        continue;
      }
      const rows = await this.rows<PublicationRow>(
        runner,
        `SELECT id,page_id,path,parent_publication_id,publication_type,include_descendants,unpublished_at,published_by
         FROM page_publications WHERE site_id=$1`,
        [site.id],
      );
      const byPage = new Map(rows.map((row) => [row.page_id, row]));
      const paths = new Set(rows.map((row) => row.path));
      const pending = [
        { pageId: site.root_page_id, publicationId: site.root_id, path: '/' },
      ];
      while (pending.length) {
        const parent = pending.shift()!;
        const children = await this.rows<ChildRow>(
          runner,
          `SELECT id,slug,title FROM pages WHERE parent_page_id=$1 AND deleted_at IS NULL ORDER BY created_at,id`,
          [parent.pageId],
        );
        for (const child of children) {
          let publication = byPage.get(child.id);
          if (publication?.publication_type === 'DIRECT')
            throw new Error(
              `Historical non-root DIRECT publication in site ${site.id}`,
            );
          if (
            publication &&
            publication.parent_publication_id !== parent.publicationId
          )
            throw new Error(
              `Historical publication parent mismatch in site ${site.id}`,
            );
          if (
            publication &&
            !publication.path.startsWith(
              parent.path === '/' ? '/' : `${parent.path}/`,
            )
          )
            throw new Error(
              `Historical publication path mismatch in site ${site.id}`,
            );
          if (publication) {
            if (publication.unpublished_at !== null)
              await runner.query(
                `UPDATE page_publications SET unpublished_at=NULL,published_at=now(),updated_at=now() WHERE id=$1`,
                [publication.id],
              );
          } else {
            const base =
              (child.slug ?? child.title)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') || 'page';
            const prefix = parent.path === '/' ? '' : parent.path;
            let path = '';
            for (let suffix = 1; suffix <= 10000; suffix++) {
              path = `${prefix}/${base}${suffix === 1 ? '' : `-${suffix}`}`;
              if (!paths.has(path)) break;
              path = '';
            }
            if (!path || path.length > 2048)
              throw new Error('Publication path backfill limit exceeded');
            publication = {
              id: randomUUID(),
              page_id: child.id,
              path,
              parent_publication_id: parent.publicationId,
              publication_type: 'INHERITED',
              include_descendants: false,
              unpublished_at: null,
              published_by: site.published_by,
            };
            await runner.query(
              `INSERT INTO page_publications
              (id,site_id,page_id,path,parent_publication_id,publication_type,include_descendants,published_by,published_at,unpublished_at)
              VALUES ($1,$2,$3,$4,$5,'INHERITED',false,$6,now(),NULL)`,
              [
                publication.id,
                site.id,
                child.id,
                path,
                parent.publicationId,
                site.published_by,
              ],
            );
            await runner.query(
              `INSERT INTO publication_root_ownership_created_publications VALUES ($1)`,
              [publication.id],
            );
            byPage.set(child.id, publication);
            paths.add(path);
          }
          pending.push({
            pageId: child.id,
            publicationId: publication.id,
            path: publication.path,
          });
        }
      }
    }
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `DROP TRIGGER TR_site_root_ownership ON published_sites`,
    );
    await runner.query(`DROP FUNCTION check_site_root_ownership()`);
    await runner.query(`DROP TRIGGER TR_pages_public_site_ownership ON pages`);
    await runner.query(`DROP FUNCTION check_page_public_site_ownership()`);
    await runner.query(`DELETE FROM page_publications pp USING publication_root_ownership_created_publications b
      WHERE pp.id=b.publication_id`);
    await runner.query(`UPDATE page_publications pp SET unpublished_at=b.unpublished_at,
      published_at=b.published_at,updated_at=b.updated_at,published_by=b.published_by
      FROM publication_root_ownership_publication_backup b WHERE pp.id=b.publication_id`);
    await runner.query(`UPDATE published_sites s SET disabled_at=b.disabled_at,updated_at=b.updated_at
      FROM publication_root_ownership_site_backup b WHERE s.id=b.site_id`);
    await runner.query(
      `DROP TABLE publication_root_ownership_publication_backup`,
    );
    await runner.query(
      `DROP TABLE publication_root_ownership_created_publications`,
    );
    await runner.query(`DROP TABLE publication_root_ownership_site_backup`);
    await runner.query(`DROP INDEX UQ_pages_public_subdomain`);
    await runner.query(
      `ALTER TABLE pages DROP CONSTRAINT CK_pages_public_subdomain_root, DROP COLUMN public_subdomain`,
    );
  }
}
