import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1788597148310 implements MigrationInterface {
  name = 'InitSchema1788597148310';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * 1. PageShareLink không còn access level.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_links"
      DROP COLUMN "access_level"
    `);

    /**
     * 2. Dữ liệu COMMENTER cũ chuyển thành VIEWER
     * trước khi bỏ COMMENTER khỏi enum.
     */
    await queryRunner.query(`
      UPDATE "page_shares"
      SET "access_level" = 'VIEWER'
      WHERE "access_level" = 'COMMENTER'
    `);

    /**
     * 3. Đổi enum cũ sang enum mới:
     * VIEWER | EDITOR
     */
    await queryRunner.query(`
      ALTER TYPE "public"."resource_access_level_enum"
      RENAME TO "resource_access_level_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."resource_access_level_enum"
      AS ENUM (
        'VIEWER',
        'EDITOR'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "page_shares"
      ALTER COLUMN "access_level"
      TYPE "public"."resource_access_level_enum"
      USING "access_level"::text::"public"."resource_access_level_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."resource_access_level_enum_old"
    `);

    /**
     * 4. Biết PageShare được tạo từ link nào.
     */
    await queryRunner.query(`
      ALTER TABLE "page_shares"
      ADD COLUMN "share_link_id" uuid NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_page_shares_share_link_id"
      ON "page_shares" ("share_link_id")
    `);

    /**
     * 5. FK tới PageShareLink.
     */
    await queryRunner.query(`
      ALTER TABLE "page_shares"
      ADD CONSTRAINT "FK_page_shares_share_link_id"
      FOREIGN KEY ("share_link_id")
      REFERENCES "page_share_links"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * 1. Bỏ quan hệ với share link.
     */
    await queryRunner.query(`
      ALTER TABLE "page_shares"
      DROP CONSTRAINT "FK_page_shares_share_link_id"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_page_shares_share_link_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "page_shares"
      DROP COLUMN "share_link_id"
    `);

    /**
     * 2. Khôi phục enum cũ có COMMENTER.
     */
    await queryRunner.query(`
      ALTER TYPE "public"."resource_access_level_enum"
      RENAME TO "resource_access_level_enum_new"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."resource_access_level_enum"
      AS ENUM (
        'COMMENTER',
        'EDITOR',
        'VIEWER'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "page_shares"
      ALTER COLUMN "access_level"
      TYPE "public"."resource_access_level_enum"
      USING "access_level"::text::"public"."resource_access_level_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."resource_access_level_enum_new"
    `);

    /**
     * 3. Khôi phục access_level cho PageShareLink.
     *
     * Dữ liệu role cũ không thể phục hồi chính xác,
     * nên các link hiện có mặc định VIEWER.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_links"
      ADD COLUMN "access_level"
      "public"."resource_access_level_enum"
      NOT NULL
      DEFAULT 'VIEWER'
    `);

    await queryRunner.query(`
      ALTER TABLE "page_share_links"
      ALTER COLUMN "access_level"
      DROP DEFAULT
    `);
  }
}
