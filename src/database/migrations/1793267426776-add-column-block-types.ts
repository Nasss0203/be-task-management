import { MigrationInterface, QueryRunner } from 'typeorm';

const ENUMS = ['page_blocks_type_enum', 'page_template_blocks_type_enum'];

export class AddColumnBlockTypes1793267426776 implements MigrationInterface {
  name = 'AddColumnBlockTypes1793267426776';

  async up(runner: QueryRunner): Promise<void> {
    for (const enumName of ENUMS) {
      // Additive only: append the two layout types after the existing ones.
      await runner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'COLUMN_LIST'`,
      );
      await runner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'COLUMN'`,
      );
    }
  }

  async down(): Promise<void> {
    // PostgreSQL cannot remove an enum label without replacing its type.
    // An unused extra label is compatible with the old application.
  }
}
