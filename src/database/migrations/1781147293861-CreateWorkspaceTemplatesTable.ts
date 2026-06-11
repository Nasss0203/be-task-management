import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkspaceTemplatesTable1781147293861 implements MigrationInterface {
    name = 'CreateWorkspaceTemplatesTable1781147293861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "workspace_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "category" character varying(100), "cover_url" text, "config" jsonb NOT NULL, "is_system" boolean NOT NULL DEFAULT true, "page_template_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_51e21f5cf8dcaf4bf016878f998" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "workspace_templates"`);
    }

}
