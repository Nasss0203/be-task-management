import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1776094912046 implements MigrationInterface {
    name = 'InitSchema1776094912046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_user_workspaces"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'MEMBER', 'ADMIN')`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')`);
        await queryRunner.query(`CREATE TABLE "workspace_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "user_id" uuid, "email" character varying(255) NOT NULL, "role_name" "public"."workspace_invites_role_name_enum" NOT NULL DEFAULT 'MEMBER', "invited_by" uuid NOT NULL, "token" character varying(255) NOT NULL, "status" "public"."workspace_invites_status_enum" NOT NULL DEFAULT 'PENDING', "accepted_at" TIMESTAMP, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_43f7a0e0b0549fe2581e9cb57bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_invites_user_id" ON "workspace_invites" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_invites_invited_by" ON "workspace_invites" ("invited_by") `);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_invites_status" ON "workspace_invites" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_invites_email" ON "workspace_invites" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_workspace_invites_workspace_id" ON "workspace_invites" ("workspace_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_workspace_invites_token" ON "workspace_invites" ("token") `);
        await queryRunner.query(`ALTER TABLE "user_workspaces" DROP COLUMN "joined_at"`);
        await queryRunner.query(`ALTER TABLE "user_workspaces" ADD "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_workspaces" DROP COLUMN "last_opened_at"`);
        await queryRunner.query(`ALTER TABLE "user_workspaces" ADD "last_opened_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_user_workspaces_workspace_id" ON "user_workspaces" ("workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_workspaces_user_id" ON "user_workspaces" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_workspaces_workspace_user" ON "user_workspaces" ("workspace_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ADD CONSTRAINT "FK_9ffc4e5b893e8fb91d66d466f6d" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ADD CONSTRAINT "FK_93d8174e8b1537da7b092621c7f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ADD CONSTRAINT "FK_cf390e54ae1d8871cb74aad9c89" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_invites" DROP CONSTRAINT "FK_cf390e54ae1d8871cb74aad9c89"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" DROP CONSTRAINT "FK_93d8174e8b1537da7b092621c7f"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" DROP CONSTRAINT "FK_9ffc4e5b893e8fb91d66d466f6d"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_user_workspaces_workspace_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_workspaces_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_workspaces_workspace_id"`);
        await queryRunner.query(`ALTER TABLE "user_workspaces" DROP COLUMN "last_opened_at"`);
        await queryRunner.query(`ALTER TABLE "user_workspaces" ADD "last_opened_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_workspaces" DROP COLUMN "joined_at"`);
        await queryRunner.query(`ALTER TABLE "user_workspaces" ADD "joined_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`DROP INDEX "public"."UQ_workspace_invites_token"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_invites_workspace_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_invites_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_invites_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_invites_invited_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_workspace_invites_user_id"`);
        await queryRunner.query(`DROP TABLE "workspace_invites"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_workspaces" ON "user_workspaces" ("user_id", "workspace_id") `);
    }

}
