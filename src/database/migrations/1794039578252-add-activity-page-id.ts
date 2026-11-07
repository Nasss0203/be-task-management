import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivityPageId1794039578252 implements MigrationInterface {
  name = 'AddActivityPageId1794039578252';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "page_id" uuid`,
    );
    await runner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_97380921c1e9044ecb947e30fc" ON "activities" ("page_id", "created_at")`,
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `DROP INDEX IF EXISTS "public"."IDX_97380921c1e9044ecb947e30fc"`,
    );
    await runner.query(
      `ALTER TABLE "activities" DROP COLUMN IF EXISTS "page_id"`,
    );
  }
}
