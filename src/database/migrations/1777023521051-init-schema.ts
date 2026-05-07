import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777023521051 implements MigrationInterface {
    name = 'InitSchema1777023521051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASKS_ASSIGNEE_ID"`);
        await queryRunner.query(`CREATE TABLE "task_assignees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "assigned_by" uuid, "assigned_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e23bc1438f7bb32f41e8d493e78" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_ASSIGNEES_ASSIGNED_BY" ON "task_assignees" ("assigned_by") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_ASSIGNEES_USER_ID" ON "task_assignees" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_ASSIGNEES_TASK_ID" ON "task_assignees" ("task_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_TASK_ASSIGNEES_TASK_USER" ON "task_assignees" ("task_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assignee_id"`);
        await queryRunner.query(`ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_0141288f2306f20da9a60ec8d69" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_bb8051e376a2b083e074678cb60" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_assignees" ADD CONSTRAINT "FK_44aef1f0e96ef4afc8d9b1f14df" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_44aef1f0e96ef4afc8d9b1f14df"`);
        await queryRunner.query(`ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_bb8051e376a2b083e074678cb60"`);
        await queryRunner.query(`ALTER TABLE "task_assignees" DROP CONSTRAINT "FK_0141288f2306f20da9a60ec8d69"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "assignee_id" uuid`);
        await queryRunner.query(`DROP INDEX "public"."UQ_TASK_ASSIGNEES_TASK_USER"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_ASSIGNEES_TASK_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_ASSIGNEES_USER_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_ASSIGNEES_ASSIGNED_BY"`);
        await queryRunner.query(`DROP TABLE "task_assignees"`);
        await queryRunner.query(`CREATE INDEX "IDX_TASKS_ASSIGNEE_ID" ON "tasks" ("assignee_id") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
