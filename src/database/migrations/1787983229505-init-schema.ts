import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1787983229505 implements MigrationInterface {
    name = 'InitSchema1787983229505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."teamspace_members_role_name_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "teamspace_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "teamspace_id" uuid NOT NULL, "workspace_member_id" uuid NOT NULL, "role_name" "public"."teamspace_members_role_name_enum" NOT NULL DEFAULT 'MEMBER', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_32a6a75312fa3f629a7fefcad85" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_teamspace_members_workspace_member_id" ON "teamspace_members" ("workspace_member_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_teamspace_members_teamspace_id" ON "teamspace_members" ("teamspace_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_teamspace_members_teamspace_workspace_member" ON "teamspace_members" ("teamspace_id", "workspace_member_id") `);
        await queryRunner.query(`CREATE TYPE "public"."teamspaces_visibility_enum" AS ENUM('OPEN', 'PRIVATE')`);
        await queryRunner.query(`CREATE TABLE "teamspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "slug" character varying(180) NOT NULL, "description" text, "icon" character varying(500), "visibility" "public"."teamspaces_visibility_enum" NOT NULL DEFAULT 'OPEN', "created_by" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "deleted_by" uuid, CONSTRAINT "PK_a37477ed618d13aed4aa2cf8170" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_teamspaces_deleted_at" ON "teamspaces" ("deleted_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_teamspaces_workspace_id" ON "teamspaces" ("workspace_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_teamspaces_workspace_slug" ON "teamspaces" ("workspace_id", "slug") `);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_name_enum" RENAME TO "workspace_members_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum" USING "role_name"::"text"::"public"."workspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum" RENAME TO "workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ADD CONSTRAINT "FK_3e20d681ae822569a6146b13f0f" FOREIGN KEY ("teamspace_id") REFERENCES "teamspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ADD CONSTRAINT "FK_5fb94943d766dd3c8791e14f94e" FOREIGN KEY ("workspace_member_id") REFERENCES "workspace_members"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teamspaces" ADD CONSTRAINT "FK_b41e5ca3e57797efa1da9c71339" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teamspaces" DROP CONSTRAINT "FK_b41e5ca3e57797efa1da9c71339"`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" DROP CONSTRAINT "FK_5fb94943d766dd3c8791e14f94e"`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" DROP CONSTRAINT "FK_3e20d681ae822569a6146b13f0f"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum_old" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_name_enum_old" RENAME TO "workspace_members_role_name_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_teamspaces_workspace_slug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_teamspaces_workspace_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_teamspaces_deleted_at"`);
        await queryRunner.query(`DROP TABLE "teamspaces"`);
        await queryRunner.query(`DROP TYPE "public"."teamspaces_visibility_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_teamspace_members_teamspace_workspace_member"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_teamspace_members_teamspace_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_teamspace_members_workspace_member_id"`);
        await queryRunner.query(`DROP TABLE "teamspace_members"`);
        await queryRunner.query(`DROP TYPE "public"."teamspace_members_role_name_enum"`);
    }

}
