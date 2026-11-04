import { MigrationInterface, QueryRunner } from 'typeorm';

const ENUMS = ['page_blocks_type_enum', 'page_template_blocks_type_enum'];

export class AddFormFieldBlockType1793358260017 implements MigrationInterface {
  name = 'AddFormFieldBlockType1793358260017';

  async up(runner: QueryRunner): Promise<void> {
    for (const enumName of ENUMS) {
      await runner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'FORM_FIELD'`,
      );
    }
  }

  async down(): Promise<void> {}
}
