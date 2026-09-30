import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicationTree1790640000000 implements MigrationInterface {
  name = 'AddPublicationTree1790640000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Fail before changing schema if historical flat data cannot form a valid tree.
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM published_sites s WHERE NOT EXISTS (
        SELECT 1 FROM page_publications p WHERE p.site_id = s.id AND p.path = '/' AND p.page_id = s.root_page_id
      )) OR EXISTS (SELECT 1 FROM page_publications p JOIN published_sites s ON s.id = p.site_id
        WHERE p.path = '/' AND p.page_id <> s.root_page_id) THEN
        RAISE EXCEPTION 'Publication tree migration requires a correct root publication for every site';
      END IF;
    END $$`);
    await queryRunner.query(
      `CREATE TYPE "page_publication_type" AS ENUM ('DIRECT', 'INHERITED')`,
    );
    await queryRunner.query(`ALTER TABLE "page_publications"
      ADD "parent_publication_id" uuid,
      ADD "publication_type" "page_publication_type" NOT NULL DEFAULT 'DIRECT',
      ADD "include_descendants" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`UPDATE "page_publications" child
      SET "parent_publication_id" = root.id
      FROM "page_publications" root
      WHERE child.site_id = root.site_id AND root.path = '/' AND child.path <> '/'`);
    await queryRunner.query(`ALTER TABLE "page_publications"
      ADD CONSTRAINT "UQ_page_publications_site_id_id" UNIQUE ("site_id", "id"),
      ADD CONSTRAINT "CK_page_publications_shape" CHECK (
        (path = '/' AND parent_publication_id IS NULL AND publication_type = 'DIRECT') OR
        (path <> '/' AND parent_publication_id IS NOT NULL AND parent_publication_id <> id)
      ),
      ADD CONSTRAINT "CK_page_publications_inherited_options" CHECK (publication_type <> 'INHERITED' OR include_descendants = false),
      ADD CONSTRAINT "FK_page_publications_parent" FOREIGN KEY ("site_id", "parent_publication_id")
      REFERENCES "page_publications"("site_id", "id") ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED`);
    await queryRunner.query(
      `CREATE INDEX "IDX_page_publications_parent_publication_id" ON "page_publications" ("parent_publication_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_page_publications_parent_publication_id"`,
    );
    await queryRunner.query(`ALTER TABLE "page_publications"
      DROP CONSTRAINT "FK_page_publications_parent",
      DROP CONSTRAINT "CK_page_publications_inherited_options",
      DROP CONSTRAINT "CK_page_publications_shape",
      DROP CONSTRAINT "UQ_page_publications_site_id_id",
      DROP COLUMN "parent_publication_id", DROP COLUMN "publication_type", DROP COLUMN "include_descendants"`);
    await queryRunner.query(`DROP TYPE "page_publication_type"`);
  }
}
