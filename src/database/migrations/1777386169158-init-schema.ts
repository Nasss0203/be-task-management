import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777386169158 implements MigrationInterface {
    name = 'InitSchema1777386169158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."attachments_provider_enum" AS ENUM('R2', 'CLOUDINARY')`);
        await queryRunner.query(`CREATE TYPE "public"."attachments_status_enum" AS ENUM('READY', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "task_id" uuid, "comment_id" uuid, "uploaded_by" uuid NOT NULL, "file_name" character varying(255) NOT NULL, "mime_type" character varying(150) NOT NULL, "size" bigint NOT NULL, "provider" "public"."attachments_provider_enum" NOT NULL DEFAULT 'R2', "storage_key" text, "public_id" text, "url" text, "secure_url" text, "status" "public"."attachments_status_enum" NOT NULL DEFAULT 'READY', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3fb5314ef323d02aed62ccb283" ON "attachments" ("public_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ec3648b85f6af7eafe865a3257" ON "attachments" ("storage_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_7eb55326eb220fef58d00cccbf" ON "attachments" ("workspace_id", "comment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_244c5f17089416157f6dc9190f" ON "attachments" ("workspace_id", "task_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_244c5f17089416157f6dc9190f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7eb55326eb220fef58d00cccbf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec3648b85f6af7eafe865a3257"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3fb5314ef323d02aed62ccb283"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
        await queryRunner.query(`DROP TYPE "public"."attachments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."attachments_provider_enum"`);
    }

}
