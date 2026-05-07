import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1778165640975 implements MigrationInterface {
    name = 'InitSchema1778165640975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "task_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "project_id" uuid NOT NULL, "task_id" uuid NOT NULL, "author_id" uuid NOT NULL, "content" text NOT NULL, "is_edited" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_83b99b0b03db29d4cafcb579b77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_COMMENTS_TASK_CREATED_AT" ON "task_comments" ("task_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_COMMENTS_AUTHOR_ID" ON "task_comments" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_COMMENTS_TASK_ID" ON "task_comments" ("task_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_COMMENTS_PROJECT_ID" ON "task_comments" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_COMMENTS_WORKSPACE_ID" ON "task_comments" ("workspace_id") `);
        await queryRunner.query(`ALTER TABLE "task_comments" ADD CONSTRAINT "FK_ba9e465cfc707006e60aae59946" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_comments" ADD CONSTRAINT "FK_76901a920ba9ec5be8dbd64d747" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_comments" DROP CONSTRAINT "FK_76901a920ba9ec5be8dbd64d747"`);
        await queryRunner.query(`ALTER TABLE "task_comments" DROP CONSTRAINT "FK_ba9e465cfc707006e60aae59946"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_COMMENTS_WORKSPACE_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_COMMENTS_PROJECT_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_COMMENTS_TASK_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_COMMENTS_AUTHOR_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_COMMENTS_TASK_CREATED_AT"`);
        await queryRunner.query(`DROP TABLE "task_comments"`);
    }

}
