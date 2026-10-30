import { MigrationInterface, QueryRunner } from 'typeorm';

const ENUMS = ['page_blocks_type_enum', 'page_template_blocks_type_enum'];

export class AddSectionBlockType1793356440793 implements MigrationInterface {
  name = 'AddSectionBlockType1793356440793';

  async up(runner: QueryRunner): Promise<void> {
    for (const enumName of ENUMS) {
      await runner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'SECTION'`,
      );
    }
  }

  async down(): Promise<void> {}
}
