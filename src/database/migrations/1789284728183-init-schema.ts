import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1789284620127 implements MigrationInterface {
  name = 'InitSchema1789284620127';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * 1. Mở rộng enum Page Access hiện tại.
     *
     * Enum này đã tồn tại vì page_shares đang sử dụng nó.
     * Không CREATE TYPE lại.
     */
    await queryRunner.query(`
      ALTER TYPE "public"."resource_access_level_enum"
      ADD VALUE IF NOT EXISTS 'COMMENTER'
      BEFORE 'EDITOR'
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."resource_access_level_enum"
      ADD VALUE IF NOT EXISTS 'FULL_ACCESS'
      AFTER 'EDITOR'
    `);

    /**
     * 2. Chuyển link_access_level từ enum riêng
     * sang resource_access_level_enum dùng chung.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ALTER COLUMN "link_access_level"
      DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ALTER COLUMN "link_access_level"
      TYPE "public"."resource_access_level_enum"
      USING
        "link_access_level"::text
        ::"public"."resource_access_level_enum"
    `);

    /**
     * Model mới:
     * null = link access đang tắt.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ALTER COLUMN "link_access_level"
      DROP NOT NULL
    `);

    /**
     * 3. Thêm Workspace General Access.
     *
     * null = không cấp quyền từ Workspace General Access.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ADD "workspace_access_level"
      "public"."resource_access_level_enum"
    `);

    /**
     * 4. Migrate semantic của model cũ.
     *
     * general_access = RESTRICTED
     * => link access phải trở thành null.
     *
     * general_access = LINK
     * => giữ nguyên link_access_level hiện tại.
     */
    await queryRunner.query(`
      UPDATE "page_share_settings"
      SET "link_access_level" = NULL
      WHERE "general_access" = 'RESTRICTED'
    `);

    /**
     * 5. Sau khi migrate dữ liệu xong
     * mới xóa general_access.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      DROP COLUMN "general_access"
    `);

    await queryRunner.query(`
      DROP TYPE
      "public"."page_share_settings_general_access_enum"
    `);

    /**
     * link_access_level đã chuyển sang
     * resource_access_level_enum nên enum riêng
     * không còn được sử dụng.
     */
    await queryRunner.query(`
      DROP TYPE
      "public"."page_share_settings_link_access_level_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * 1. Khôi phục enum General Access cũ.
     */
    await queryRunner.query(`
      CREATE TYPE
      "public"."page_share_settings_general_access_enum"
      AS ENUM(
        'RESTRICTED',
        'LINK'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ADD "general_access"
      "public"."page_share_settings_general_access_enum"
      NOT NULL
      DEFAULT 'RESTRICTED'
    `);

    /**
     * Suy ra general_access từ link_access_level.
     */
    await queryRunner.query(`
      UPDATE "page_share_settings"
      SET "general_access" =
        CASE
          WHEN "link_access_level" IS NULL
            THEN 'RESTRICTED'
          ELSE 'LINK'
        END
        ::"public"."page_share_settings_general_access_enum"
    `);

    /**
     * 2. Khôi phục enum riêng cũ cho link.
     */
    await queryRunner.query(`
      CREATE TYPE
      "public"."page_share_settings_link_access_level_enum"
      AS ENUM(
        'VIEWER',
        'EDITOR'
      )
    `);

    /**
     * Old schema không cho null.
     *
     * COMMENTER -> VIEWER
     * FULL_ACCESS -> EDITOR
     *
     * Bình thường link mới cũng không cho
     * COMMENTER/FULL_ACCESS, nhưng mapping này
     * giúp down migration an toàn hơn.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ALTER COLUMN "link_access_level"
      TYPE
      "public"."page_share_settings_link_access_level_enum"
      USING (
        CASE
          WHEN "link_access_level" IS NULL
            THEN 'EDITOR'
          WHEN "link_access_level"::text = 'COMMENTER'
            THEN 'VIEWER'
          WHEN "link_access_level"::text = 'FULL_ACCESS'
            THEN 'EDITOR'
          ELSE "link_access_level"::text
        END
      )::"public"."page_share_settings_link_access_level_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ALTER COLUMN "link_access_level"
      SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      ALTER COLUMN "link_access_level"
      SET DEFAULT 'EDITOR'
    `);

    /**
     * 3. Xóa field mới.
     *
     * Model cũ không thể biểu diễn
     * workspace_access_level.
     */
    await queryRunner.query(`
      ALTER TABLE "page_share_settings"
      DROP COLUMN "workspace_access_level"
    `);

    /**
     * 4. Hạ PageShare mới về level cũ trước
     * khi loại COMMENTER/FULL_ACCESS khỏi enum.
     */
    await queryRunner.query(`
      UPDATE "page_shares"
      SET "access_level" = 'VIEWER'
      WHERE "access_level" = 'COMMENTER'
    `);

    await queryRunner.query(`
      UPDATE "page_shares"
      SET "access_level" = 'EDITOR'
      WHERE "access_level" = 'FULL_ACCESS'
    `);

    /**
     * PostgreSQL không hỗ trợ DROP VALUE
     * trực tiếp khỏi enum, nên recreate enum.
     */
    await queryRunner.query(`
      ALTER TYPE
      "public"."resource_access_level_enum"
      RENAME TO
      "resource_access_level_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE
      "public"."resource_access_level_enum"
      AS ENUM(
        'VIEWER',
        'EDITOR'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "page_shares"
      ALTER COLUMN "access_level"
      TYPE "public"."resource_access_level_enum"
      USING
        "access_level"::text
        ::"public"."resource_access_level_enum"
    `);

    await queryRunner.query(`
      DROP TYPE
      "public"."resource_access_level_enum_old"
    `);
  }
}
