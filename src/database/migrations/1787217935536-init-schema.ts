import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1787217935536 implements MigrationInterface {
    name = 'InitSchema1787217935536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "workspace_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role_name" "public"."workspace_members_role_name_enum" NOT NULL DEFAULT 'MEMBER', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_opened_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_members_workspace_id" ON "workspace_members" ("workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_members_user_id" ON "workspace_members" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workspace_members_workspace_user" ON "workspace_members" ("workspace_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "plan_type"`);
        await queryRunner.query(`DROP TYPE "public"."workspaces_plan_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum" RENAME TO "workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_status_enum" RENAME TO "workspace_invites_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'DECLINED')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "status" TYPE "public"."workspace_invites_status_enum" USING "status"::"text"::"public"."workspace_invites_status_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_4a7c584ddfe855379598b5e20fd" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_4e83431119fa585fc7aa8b817db" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_4e83431119fa585fc7aa8b817db"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_4a7c584ddfe855379598b5e20fd"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_status_enum_old" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "status" TYPE "public"."workspace_invites_status_enum_old" USING "status"::"text"::"public"."workspace_invites_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_status_enum_old" RENAME TO "workspace_invites_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspaces_plan_type_enum" AS ENUM('free', 'pro')`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "plan_type" "public"."workspaces_plan_type_enum" NOT NULL DEFAULT 'free'`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workspace_members_workspace_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_members_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_members_workspace_id"`);
        await queryRunner.query(`DROP TABLE "workspace_members"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_name_enum"`);
    }

}
