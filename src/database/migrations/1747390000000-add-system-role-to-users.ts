import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemRoleToUsers1747390000000 implements MigrationInterface {
  name = 'AddSystemRoleToUsers1747390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_system_role_enum" AS ENUM('USER', 'SYSTEM_ADMIN', 'SUPER_ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "system_role" "public"."users_system_role_enum" NOT NULL DEFAULT 'USER';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "system_role"`,
    );
  }
}
