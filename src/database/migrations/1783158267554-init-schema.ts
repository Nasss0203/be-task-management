import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1783158267554 implements MigrationInterface {
    name = 'InitSchema1783158267554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."ai_generation_type_enum" AS ENUM('WORKSPACE_DRAFT', 'PROJECT_DRAFT', 'TASK_DRAFT', 'SPRINT_PLAN', 'SPRINT_SUMMARY', 'DASHBOARD_INSIGHT')`);
        await queryRunner.query(`CREATE TYPE "public"."ai_provider_enum" AS ENUM('GEMINI', 'OPENAI', 'DEEPSEEK')`);
        await queryRunner.query(`CREATE TYPE "public"."ai_generation_status_enum" AS ENUM('PROCESSING', 'GENERATED', 'APPLIED', 'DISCARDED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "ai_generations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "conversation_id" uuid NOT NULL, "request_message_id" uuid, "workspace_id" uuid, "project_id" uuid, "board_id" uuid, "sprint_id" uuid, "generation_type" "public"."ai_generation_type_enum" NOT NULL, "input_text" text NOT NULL, "input_context" jsonb, "output_data" jsonb, "provider" "public"."ai_provider_enum" NOT NULL, "model" character varying(120) NOT NULL, "status" "public"."ai_generation_status_enum" NOT NULL DEFAULT 'PROCESSING', "applied_results" jsonb, "input_tokens" integer, "output_tokens" integer, "total_tokens" integer, "error_message" text, "applied_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac39086528be836b5aac57d3896" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f994835b1a547a72b4e45a9ffd" ON "ai_generations" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_e06136564da58c3394d700fc1a" ON "ai_generations" ("sprint_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5c635fff890316707be80cd148" ON "ai_generations" ("board_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_96dab4a843462a64efacee5764" ON "ai_generations" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1961f132b8336ebe3c790b9769" ON "ai_generations" ("workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a2199c6831df88c3e9c978ea4b" ON "ai_generations" ("conversation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb6e402a34c7f5630dec84ffb4" ON "ai_generations" ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."ai_message_role_enum" AS ENUM('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')`);
        await queryRunner.query(`CREATE TABLE "ai_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "role" "public"."ai_message_role_enum" NOT NULL, "content" text NOT NULL, "context" jsonb, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a390434d4a515ba18a41bc996c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eb3c8c26d9f5bb2f8ba65f65ff" ON "ai_messages" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_e869994cbb3a2904d5899c6359" ON "ai_messages" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_de21fcb2d1df7fd6ca70f555b6" ON "ai_messages" ("conversation_id") `);
        await queryRunner.query(`CREATE TABLE "ai_conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "workspace_id" uuid, "title" character varying(200) NOT NULL, "last_message_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60db12765b82858ba00c8aa4ae2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_20e5179fc9877728266e207178" ON "ai_conversations" ("last_message_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_fcf70f986be86ca896e79f6387" ON "ai_conversations" ("workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_12fdbf99ca0da93085d61edd3b" ON "ai_conversations" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "ai_generations" ADD CONSTRAINT "FK_a2199c6831df88c3e9c978ea4b5" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ai_messages" ADD CONSTRAINT "FK_de21fcb2d1df7fd6ca70f555b6d" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_messages" DROP CONSTRAINT "FK_de21fcb2d1df7fd6ca70f555b6d"`);
        await queryRunner.query(`ALTER TABLE "ai_generations" DROP CONSTRAINT "FK_a2199c6831df88c3e9c978ea4b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12fdbf99ca0da93085d61edd3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fcf70f986be86ca896e79f6387"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20e5179fc9877728266e207178"`);
        await queryRunner.query(`DROP TABLE "ai_conversations"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de21fcb2d1df7fd6ca70f555b6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e869994cbb3a2904d5899c6359"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb3c8c26d9f5bb2f8ba65f65ff"`);
        await queryRunner.query(`DROP TABLE "ai_messages"`);
        await queryRunner.query(`DROP TYPE "public"."ai_message_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb6e402a34c7f5630dec84ffb4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2199c6831df88c3e9c978ea4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1961f132b8336ebe3c790b9769"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_96dab4a843462a64efacee5764"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5c635fff890316707be80cd148"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e06136564da58c3394d700fc1a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f994835b1a547a72b4e45a9ffd"`);
        await queryRunner.query(`DROP TABLE "ai_generations"`);
        await queryRunner.query(`DROP TYPE "public"."ai_generation_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ai_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ai_generation_type_enum"`);
    }

}
