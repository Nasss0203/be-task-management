import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyAssistantTables1787050000000 implements MigrationInterface {
  name = 'DropLegacyAssistantTables1787050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_generations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_conversations" CASCADE`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."ai_message_role_enum" CASCADE`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."ai_generation_status_enum" CASCADE`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."ai_provider_enum" CASCADE`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."ai_generation_type_enum" CASCADE`,
    );
  }

  public async down(): Promise<void> {}
}
