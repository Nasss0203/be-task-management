import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1782896191370 implements MigrationInterface {
    name = 'InitSchema1782896191370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "task_positions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "context" character varying(20) NOT NULL, "context_id" uuid NOT NULL, "position" numeric(30,15) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_61c56c5ad45f6946b389f3344d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_POSITION_TASK" ON "task_positions" ("task_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_TASK_POSITION_LOOKUP" ON "task_positions" ("context", "context_id", "position") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_TASK_POSITION" ON "task_positions" ("task_id", "context", "context_id") `);
        await queryRunner.query(`ALTER TABLE "task_positions" ADD CONSTRAINT "FK_58af1addef2b2c3b783465280e7" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_positions" DROP CONSTRAINT "FK_58af1addef2b2c3b783465280e7"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_TASK_POSITION"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_POSITION_LOOKUP"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASK_POSITION_TASK"`);
        await queryRunner.query(`DROP TABLE "task_positions"`);
    }

}
