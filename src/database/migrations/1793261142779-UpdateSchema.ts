import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1793261142779 implements MigrationInterface {
  name = 'UpdateSchema1793261142779';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"UQ_PAGE_BLOCKS_ROOT_ORDER_ACTIVE\"");
    await runner.query("ALTER TABLE \"page_blocks\" ADD \"row_id\" uuid");
    await runner.query("CREATE UNIQUE INDEX \"UQ_PAGE_BLOCKS_ROW_ROOT_ORDER_ACTIVE\" ON \"page_blocks\" (\"row_id\", \"order_index\") WHERE \"parent_block_id\" IS NULL AND \"row_id\" IS NOT NULL AND \"deleted_at\" IS NULL");
    await runner.query("CREATE UNIQUE INDEX \"UQ_PAGE_BLOCKS_PAGE_ROOT_ORDER_ACTIVE\" ON \"page_blocks\" (\"page_id\", \"order_index\") WHERE \"parent_block_id\" IS NULL AND \"row_id\" IS NULL AND \"deleted_at\" IS NULL");
    await runner.query("CREATE INDEX \"IDX_PAGE_BLOCKS_ROW_PARENT_ORDER\" ON \"page_blocks\" (\"row_id\", \"parent_block_id\", \"order_index\") ");
    await runner.query("ALTER TABLE \"page_blocks\" ADD CONSTRAINT \"FK_1836d9f1d232701f9772a2e1c08\" FOREIGN KEY (\"row_id\") REFERENCES \"database_rows\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"page_blocks\" DROP CONSTRAINT \"FK_1836d9f1d232701f9772a2e1c08\"");
    await runner.query("DROP INDEX \"public\".\"IDX_PAGE_BLOCKS_ROW_PARENT_ORDER\"");
    await runner.query("DROP INDEX \"public\".\"UQ_PAGE_BLOCKS_PAGE_ROOT_ORDER_ACTIVE\"");
    await runner.query("DROP INDEX \"public\".\"UQ_PAGE_BLOCKS_ROW_ROOT_ORDER_ACTIVE\"");
    await runner.query("ALTER TABLE \"page_blocks\" DROP COLUMN \"row_id\"");
    await runner.query("CREATE UNIQUE INDEX \"UQ_PAGE_BLOCKS_ROOT_ORDER_ACTIVE\" ON \"page_blocks\" (\"order_index\", \"page_id\") WHERE ((parent_block_id IS NULL) AND (deleted_at IS NULL))");
  }
}
