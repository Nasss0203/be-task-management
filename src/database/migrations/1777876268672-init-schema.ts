import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777876268672 implements MigrationInterface {
    name = 'InitSchema1777876268672'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_SPRINTS_PROJECT_NAME"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_PROJECTS_WORKSPACE_KEY"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_BOARDS_PROJECT_NAME"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_PAGE_BLOCKS_PAGE_ORDER"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_PAGES_WORKSPACE_SLUG"`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "deleted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "deleted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD "deleted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "deleted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "boards" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "boards" ADD "deleted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "page_blocks" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "page_blocks" ADD "deleted_by" uuid`);
        await queryRunner.query(`ALTER TABLE "pages" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pages" ADD "deleted_by" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_WORKSPACES_DELETED_AT" ON "workspaces" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASKS_DELETED_AT" ON "tasks" ("deleted_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SPRINTS_PROJECT_NAME_ACTIVE" ON "sprints" ("project_id", "name") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_SPRINTS_DELETED_AT" ON "sprints" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_PROJECTS_DELETED_AT" ON "projects" ("deleted_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_PROJECTS_WORKSPACE_KEY_ACTIVE" ON "projects" ("workspace_id", "key") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_BOARDS_PROJECT_NAME_ACTIVE" ON "boards" ("project_id", "name") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_BOARDS_DELETED_AT" ON "boards" ("deleted_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_PAGE_BLOCKS_PAGE_ORDER_ACTIVE" ON "page_blocks" ("page_id", "order_index") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_PAGE_BLOCKS_DELETED_AT" ON "page_blocks" ("deleted_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_PAGES_WORKSPACE_SLUG_ACTIVE" ON "pages" ("workspace_id", "slug") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_PAGES_DELETED_AT" ON "pages" ("deleted_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_PAGES_DELETED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_PAGES_WORKSPACE_SLUG_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PAGE_BLOCKS_DELETED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_PAGE_BLOCKS_PAGE_ORDER_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_BOARDS_DELETED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_BOARDS_PROJECT_NAME_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_PROJECTS_WORKSPACE_KEY_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_PROJECTS_DELETED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SPRINTS_DELETED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_SPRINTS_PROJECT_NAME_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASKS_DELETED_AT"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_WORKSPACES_DELETED_AT"`);
        await queryRunner.query(`ALTER TABLE "pages" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "pages" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "page_blocks" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "page_blocks" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "deleted_by"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_PAGES_WORKSPACE_SLUG" ON "pages" ("slug", "workspace_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_PAGE_BLOCKS_PAGE_ORDER" ON "page_blocks" ("order_index", "page_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_BOARDS_PROJECT_NAME" ON "boards" ("name", "project_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_PROJECTS_WORKSPACE_KEY" ON "projects" ("key", "workspace_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SPRINTS_PROJECT_NAME" ON "sprints" ("name", "project_id") `);
    }

}
