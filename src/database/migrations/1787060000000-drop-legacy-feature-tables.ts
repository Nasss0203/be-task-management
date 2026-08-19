import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyFeatureTables1787060000000 implements MigrationInterface {
  name = 'DropLegacyFeatureTables1787060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "workspace_feature_settings" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_features" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "features" CASCADE`);
  }

  public async down(): Promise<void> {}
}
