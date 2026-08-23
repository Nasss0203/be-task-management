import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPageBlockParentForeignKey1787486000000 implements MigrationInterface {
  name = 'AddPageBlockParentForeignKey1787486000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_PAGE_BLOCKS_PARENT_BLOCK'
        ) THEN
          ALTER TABLE "page_blocks"
          ADD CONSTRAINT "FK_PAGE_BLOCKS_PARENT_BLOCK"
          FOREIGN KEY ("parent_block_id")
          REFERENCES "page_blocks"("id")
          ON DELETE NO ACTION
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "page_blocks" DROP CONSTRAINT IF EXISTS "FK_PAGE_BLOCKS_PARENT_BLOCK"`,
    );
  }
}
