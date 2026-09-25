import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiAssistantSchema1790269200001 implements MigrationInterface {
  name = 'AddAiAssistantSchema1790269200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ai_conversations_status_enum" AS ENUM('ACTIVE', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_messages_role_enum" AS ENUM('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generations_status_enum" AS ENUM('PROCESSING', 'COMPLETED', 'APPLIED', 'DISCARDED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_tool_calls_status_enum" AS ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')`,
    );

    await queryRunner.query(
      `CREATE TABLE "ai_conversations" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "workspace_id" uuid,
        "title" character varying(255),
        "status" "public"."ai_conversations_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_conversations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ai_conversations_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_user_id" ON "ai_conversations" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_workspace_id" ON "ai_conversations" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_created_at" ON "ai_conversations" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_user_created_at" ON "ai_conversations" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_workspace_created_at" ON "ai_conversations" ("workspace_id", "created_at")`,
    );

    await queryRunner.query(
      `CREATE TABLE "ai_messages" (
        "id" uuid NOT NULL,
        "conversation_id" uuid NOT NULL,
        "role" "public"."ai_messages_role_enum" NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_messages_conversation_id" ON "ai_messages" ("conversation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_messages_conversation_created_at" ON "ai_messages" ("conversation_id", "created_at")`,
    );

    await queryRunner.query(
      `CREATE TABLE "ai_generations" (
        "id" uuid NOT NULL,
        "conversation_id" uuid,
        "user_id" uuid NOT NULL,
        "workspace_id" uuid,
        "capability" character varying(100) NOT NULL,
        "status" "public"."ai_generations_status_enum" NOT NULL DEFAULT 'PROCESSING',
        "input_data" jsonb,
        "output_data" jsonb,
        "provider" character varying(100),
        "model" character varying(255),
        "error_code" character varying(100),
        "error_message" text,
        "applied_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_generations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_generations_conversation" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ai_generations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ai_generations_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_conversation_id" ON "ai_generations" ("conversation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_user_id" ON "ai_generations" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_workspace_id" ON "ai_generations" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_status" ON "ai_generations" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_created_at" ON "ai_generations" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_user_created_at" ON "ai_generations" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_workspace_created_at" ON "ai_generations" ("workspace_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_conversation_created_at" ON "ai_generations" ("conversation_id", "created_at")`,
    );

    await queryRunner.query(
      `CREATE TABLE "ai_usage" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "workspace_id" uuid,
        "conversation_id" uuid,
        "generation_id" uuid,
        "provider" character varying(100) NOT NULL,
        "model" character varying(255) NOT NULL,
        "prompt_tokens" integer NOT NULL DEFAULT 0,
        "completion_tokens" integer NOT NULL DEFAULT 0,
        "total_tokens" integer NOT NULL DEFAULT 0,
        "estimated_cost" numeric(18,8),
        "currency" character varying(3),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_usage" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_ai_usage_prompt_tokens_non_negative" CHECK ("prompt_tokens" >= 0),
        CONSTRAINT "CHK_ai_usage_completion_tokens_non_negative" CHECK ("completion_tokens" >= 0),
        CONSTRAINT "CHK_ai_usage_total_tokens_non_negative" CHECK ("total_tokens" >= 0),
        CONSTRAINT "CHK_ai_usage_estimated_cost_non_negative" CHECK ("estimated_cost" IS NULL OR "estimated_cost" >= 0),
        CONSTRAINT "FK_ai_usage_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ai_usage_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ai_usage_conversation" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_ai_usage_generation" FOREIGN KEY ("generation_id") REFERENCES "ai_generations"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_user_id" ON "ai_usage" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_workspace_id" ON "ai_usage" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_generation_id" ON "ai_usage" ("generation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_conversation_id" ON "ai_usage" ("conversation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_created_at" ON "ai_usage" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_user_created_at" ON "ai_usage" ("user_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_workspace_created_at" ON "ai_usage" ("workspace_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_model_created_at" ON "ai_usage" ("model", "created_at")`,
    );

    await queryRunner.query(
      `CREATE TABLE "ai_tool_calls" (
        "id" uuid NOT NULL,
        "generation_id" uuid NOT NULL,
        "tool_name" character varying(255) NOT NULL,
        "status" "public"."ai_tool_calls_status_enum" NOT NULL DEFAULT 'PENDING',
        "arguments" jsonb,
        "result_metadata" jsonb,
        "duration_ms" integer,
        "error_code" character varying(100),
        "error_message" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_tool_calls" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_ai_tool_calls_duration_ms_non_negative" CHECK ("duration_ms" IS NULL OR "duration_ms" >= 0),
        CONSTRAINT "FK_ai_tool_calls_generation" FOREIGN KEY ("generation_id") REFERENCES "ai_generations"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_generation_id" ON "ai_tool_calls" ("generation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_tool_name" ON "ai_tool_calls" ("tool_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_status" ON "ai_tool_calls" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_generation_created_at" ON "ai_tool_calls" ("generation_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ai_tool_calls"`);
    await queryRunner.query(`DROP TABLE "ai_usage"`);
    await queryRunner.query(`DROP TABLE "ai_generations"`);
    await queryRunner.query(`DROP TABLE "ai_messages"`);
    await queryRunner.query(`DROP TABLE "ai_conversations"`);

    await queryRunner.query(`DROP TYPE "public"."ai_tool_calls_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ai_generations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ai_messages_role_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."ai_conversations_status_enum"`,
    );
  }
}
