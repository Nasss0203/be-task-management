import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1787485597431 implements MigrationInterface {
  name = 'InitSchema1787485597431';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."UQ_PAGE_BLOCKS_PAGE_ORDER_ACTIVE"`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_blocks" ADD "parent_block_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PAGE_BLOCKS_PARENT_BLOCK_ID" ON "page_blocks" ("parent_block_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_PAGE_BLOCKS_ROOT_ORDER_ACTIVE" ON "page_blocks" ("page_id", "order_index") WHERE "parent_block_id" IS NULL AND "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_PAGE_BLOCKS_CHILD_ORDER_ACTIVE" ON "page_blocks" ("page_id", "parent_block_id", "order_index") WHERE "parent_block_id" IS NOT NULL AND "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_blocks" ADD CONSTRAINT "FK_PAGE_BLOCKS_PARENT_BLOCK" FOREIGN KEY ("parent_block_id") REFERENCES "page_blocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "page_blocks" DROP CONSTRAINT "FK_PAGE_BLOCKS_PARENT_BLOCK"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_PAGE_BLOCKS_CHILD_ORDER_ACTIVE"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_PAGE_BLOCKS_ROOT_ORDER_ACTIVE"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_PAGE_BLOCKS_PARENT_BLOCK_ID"`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_blocks" DROP COLUMN "parent_block_id"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_PAGE_BLOCKS_PAGE_ORDER_ACTIVE" ON "page_blocks" ("page_id", "order_index") WHERE "deleted_at" IS NULL`,
    );
  }
}
