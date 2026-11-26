import { MigrationInterface, QueryRunner } from 'typeorm';

const ENUMS = ['page_blocks_type_enum', 'page_template_blocks_type_enum'];

export class AddAudioBlockType1795540000000 implements MigrationInterface {
  name = 'AddAudioBlockType1795540000000';

  async up(runner: QueryRunner): Promise<void> {
    for (const enumName of ENUMS) {
      await runner.query(
        `ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'AUDIO'`,
      );
    }
  }

  async down(): Promise<void> {}
}
