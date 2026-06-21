import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToWorkspace1781600000000 implements MigrationInterface {
  name = 'AddCreatedByToWorkspace1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "created_by" uuid NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "created_by"`,
    );
  }
}
