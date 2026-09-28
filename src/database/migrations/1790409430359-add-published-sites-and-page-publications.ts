import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublishedSitesAndPagePublications1790409430359 implements MigrationInterface {
  name = 'AddPublishedSitesAndPagePublications1790409430359';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "published_sites" (
        "id" uuid NOT NULL,
        "workspace_id" uuid NOT NULL,
        "root_page_id" uuid NOT NULL,
        "subdomain" character varying(63) NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "disabled_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_published_sites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_published_sites_subdomain" UNIQUE ("subdomain"),
        CONSTRAINT "FK_published_sites_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_published_sites_root_page" FOREIGN KEY ("root_page_id") REFERENCES "pages"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_published_sites_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_published_sites_workspace_id" ON "published_sites" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_published_sites_disabled_at" ON "published_sites" ("disabled_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "page_publications" (
        "id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "page_id" uuid NOT NULL,
        "path" character varying(2048) NOT NULL,
        "published_by" uuid NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "unpublished_at" TIMESTAMP WITH TIME ZONE,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_page_publications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_page_publications_site_page" UNIQUE ("site_id", "page_id"),
        CONSTRAINT "UQ_page_publications_site_path" UNIQUE ("site_id", "path"),
        CONSTRAINT "FK_page_publications_site" FOREIGN KEY ("site_id") REFERENCES "published_sites"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_page_publications_page" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_page_publications_published_by" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_page_publications_site_id" ON "page_publications" ("site_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_publications_page_id" ON "page_publications" ("page_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_publications_unpublished_at" ON "page_publications" ("unpublished_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "page_publications"`);
    await queryRunner.query(`DROP TABLE "published_sites"`);
  }
}
