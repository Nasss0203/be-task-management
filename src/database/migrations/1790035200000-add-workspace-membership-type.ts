import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceMembershipType1790035200000 implements MigrationInterface {
  name = 'AddWorkspaceMembershipType1790035200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_members_membership_type_enum" AS ENUM('MEMBER', 'GUEST')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD "membership_type" "public"."workspace_members_membership_type_enum" NOT NULL DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `UPDATE "workspace_members" SET "membership_type" = 'MEMBER'`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "CHK_workspace_members_membership_type_role" CHECK (("membership_type" = 'GUEST' AND "role_name" IS NULL) OR ("membership_type" = 'MEMBER' AND "role_name" IS NOT NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "CHK_workspace_members_membership_type_role"`,
    );
    await queryRunner.query(
      `UPDATE "workspace_members" SET "membership_type" = 'MEMBER', "role_name" = COALESCE("role_name", 'MEMBER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP COLUMN "membership_type"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_members_membership_type_enum"`,
    );
  }
}
