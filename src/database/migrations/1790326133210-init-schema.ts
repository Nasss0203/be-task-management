import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1790326133210 implements MigrationInterface {
  name = 'InitSchema1790326133210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP CONSTRAINT "FK_a2199c6831df88c3e9c978ea4b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f994835b1a547a72b4e45a9ffd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e06136564da58c3394d700fc1a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5c635fff890316707be80cd148"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_96dab4a843462a64efacee5764"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1961f132b8336ebe3c790b9769"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2199c6831df88c3e9c978ea4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb6e402a34c7f5630dec84ffb4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb3c8c26d9f5bb2f8ba65f65ff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e869994cbb3a2904d5899c6359"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de21fcb2d1df7fd6ca70f555b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20e5179fc9877728266e207178"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fcf70f986be86ca896e79f6387"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12fdbf99ca0da93085d61edd3b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_workspace_subscriptions_workspace_id"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_tool_calls_status_enum" AS ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_tool_calls" ("id" uuid NOT NULL, "generation_id" uuid NOT NULL, "tool_name" character varying(255) NOT NULL, "status" "public"."ai_tool_calls_status_enum" NOT NULL DEFAULT 'PENDING', "arguments" jsonb, "result_metadata" jsonb, "duration_ms" integer, "error_code" character varying(100), "error_message" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_ai_tool_calls_duration_ms_non_negative" CHECK ("duration_ms" IS NULL OR "duration_ms" >= 0), CONSTRAINT "PK_d9582da589bad9f520cfdfe337e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_generation_created_at" ON "ai_tool_calls" ("generation_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_status" ON "ai_tool_calls" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_tool_name" ON "ai_tool_calls" ("tool_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_tool_calls_generation_id" ON "ai_tool_calls" ("generation_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_usage" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "workspace_id" uuid, "conversation_id" uuid, "generation_id" uuid, "provider" character varying(100) NOT NULL, "model" character varying(255) NOT NULL, "prompt_tokens" integer NOT NULL DEFAULT '0', "completion_tokens" integer NOT NULL DEFAULT '0', "total_tokens" integer NOT NULL DEFAULT '0', "estimated_cost" numeric(18,8), "currency" character varying(3), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_ai_usage_estimated_cost_non_negative" CHECK ("estimated_cost" IS NULL OR "estimated_cost" >= 0), CONSTRAINT "CHK_ai_usage_total_tokens_non_negative" CHECK ("total_tokens" >= 0), CONSTRAINT "CHK_ai_usage_completion_tokens_non_negative" CHECK ("completion_tokens" >= 0), CONSTRAINT "CHK_ai_usage_prompt_tokens_non_negative" CHECK ("prompt_tokens" >= 0), CONSTRAINT "PK_3dddab3a15520a9c3eba859195d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_model_created_at" ON "ai_usage" ("model", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_workspace_created_at" ON "ai_usage" ("workspace_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_user_created_at" ON "ai_usage" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_created_at" ON "ai_usage" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_conversation_id" ON "ai_usage" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_generation_id" ON "ai_usage" ("generation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_workspace_id" ON "ai_usage" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_usage_user_id" ON "ai_usage" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_auth_identities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" character varying(50) NOT NULL, "issuer" character varying(500) NOT NULL, "provider_subject" character varying(255) NOT NULL, "provider_email" character varying(255), "email_verified" boolean NOT NULL DEFAULT false, "tenant_id" character varying(255), "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_user_auth_identities" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_auth_identities_provider_issuer_subject_tenant" ON "user_auth_identities" ("provider", "issuer", "provider_subject", "tenant_id") WHERE "tenant_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_auth_identities_provider_issuer_subject_null_tenant" ON "user_auth_identities" ("provider", "issuer", "provider_subject") WHERE "tenant_id" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_auth_identities_user_id" ON "user_auth_identities" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "request_message_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "project_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "board_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "sprint_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "generation_type"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_generation_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "input_context"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "applied_results"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "input_tokens"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "output_tokens"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "total_tokens"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "input_text"`,
    );
    await queryRunner.query(`ALTER TABLE "ai_messages" DROP COLUMN "context"`);
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "last_message_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "capability" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "input_data" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "error_code" character varying(100)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_conversations_status_enum" AS ENUM('ACTIVE', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "status" "public"."ai_conversations_status_enum" NOT NULL DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."teamspace_members_role_name_enum" RENAME TO "teamspace_members_role_name_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teamspace_members_role_name_enum" AS ENUM('OWNER', 'MEMBER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" TYPE "public"."teamspace_members_role_name_enum" USING "role_name"::"text"::"public"."teamspace_members_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."teamspace_members_role_name_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."teamspaces_visibility_enum" RENAME TO "teamspaces_visibility_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teamspaces_visibility_enum" AS ENUM('OPEN', 'PRIVATE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspaces" ALTER COLUMN "visibility" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspaces" ALTER COLUMN "visibility" TYPE "public"."teamspaces_visibility_enum" USING "visibility"::"text"::"public"."teamspaces_visibility_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspaces" ALTER COLUMN "visibility" SET DEFAULT 'OPEN'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."teamspaces_visibility_enum_old"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."workspace_members_role_name_enum" RENAME TO "workspace_members_role_name_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_members_role_name_enum" AS ENUM('OWNER', 'MEMBER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum" USING "role_name"::"text"::"public"."workspace_members_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_members_role_name_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "conversation_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generation_status_enum" RENAME TO "ai_generation_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generations_status_enum" AS ENUM('PROCESSING', 'COMPLETED', 'APPLIED', 'DISCARDED', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" TYPE "public"."ai_generations_status_enum" USING "status"::"text"::"public"."ai_generations_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" SET DEFAULT 'PROCESSING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_generation_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "provider"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_provider_enum"`);
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "provider" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "ai_generations" DROP COLUMN "model"`);
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "model" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "applied_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "applied_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_message_role_enum" RENAME TO "ai_message_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_messages_role_enum" AS ENUM('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ALTER COLUMN "role" TYPE "public"."ai_messages_role_enum" USING "role"::"text"::"public"."ai_messages_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_message_role_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "ai_messages" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" DROP CONSTRAINT "FK_de21fcb2d1df7fd6ca70f555b6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "title" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workspace_invites_role_name_enum" RENAME TO "workspace_invites_role_name_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'MEMBER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_invites_role_name_enum_old"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_conversation_created_at" ON "ai_generations" ("conversation_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_workspace_created_at" ON "ai_generations" ("workspace_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_user_created_at" ON "ai_generations" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_created_at" ON "ai_generations" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_status" ON "ai_generations" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_workspace_id" ON "ai_generations" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_user_id" ON "ai_generations" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_generations_conversation_id" ON "ai_generations" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_messages_conversation_created_at" ON "ai_messages" ("conversation_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_messages_conversation_id" ON "ai_messages" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_workspace_created_at" ON "ai_conversations" ("workspace_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_user_created_at" ON "ai_conversations" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_created_at" ON "ai_conversations" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_workspace_id" ON "ai_conversations" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_user_id" ON "ai_conversations" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workspace_subscriptions_workspace_id" ON "workspace_subscriptions" ("workspace_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" ADD CONSTRAINT "FK_73b4726214c8da50c03f959bdcc" FOREIGN KEY ("generation_id") REFERENCES "ai_generations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" ADD CONSTRAINT "FK_1b342fd5b20e5ffca652770404d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" ADD CONSTRAINT "FK_389fa8c971c418b326ecac0d8aa" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" ADD CONSTRAINT "FK_fb51cf283ac9e86792e4c0008a3" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" ADD CONSTRAINT "FK_8d35990de31cf2fb45be6002a34" FOREIGN KEY ("generation_id") REFERENCES "ai_generations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD CONSTRAINT "FK_a2199c6831df88c3e9c978ea4b5" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD CONSTRAINT "FK_cb6e402a34c7f5630dec84ffb49" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD CONSTRAINT "FK_1961f132b8336ebe3c790b9769b" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ADD CONSTRAINT "FK_de21fcb2d1df7fd6ca70f555b6d" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD CONSTRAINT "FK_12fdbf99ca0da93085d61edd3bb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD CONSTRAINT "FK_fcf70f986be86ca896e79f6387e" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_auth_identities" ADD CONSTRAINT "FK_user_auth_identities_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_auth_identities" DROP CONSTRAINT "FK_user_auth_identities_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP CONSTRAINT "FK_fcf70f986be86ca896e79f6387e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP CONSTRAINT "FK_12fdbf99ca0da93085d61edd3bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" DROP CONSTRAINT "FK_de21fcb2d1df7fd6ca70f555b6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP CONSTRAINT "FK_1961f132b8336ebe3c790b9769b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP CONSTRAINT "FK_cb6e402a34c7f5630dec84ffb49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP CONSTRAINT "FK_a2199c6831df88c3e9c978ea4b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" DROP CONSTRAINT "FK_8d35990de31cf2fb45be6002a34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" DROP CONSTRAINT "FK_fb51cf283ac9e86792e4c0008a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" DROP CONSTRAINT "FK_389fa8c971c418b326ecac0d8aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage" DROP CONSTRAINT "FK_1b342fd5b20e5ffca652770404d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" DROP CONSTRAINT "FK_73b4726214c8da50c03f959bdcc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_workspace_subscriptions_workspace_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_conversations_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_conversations_workspace_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_conversations_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_conversations_user_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_conversations_workspace_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_messages_conversation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_messages_conversation_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_generations_conversation_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_generations_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_generations_workspace_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_generations_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_generations_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_generations_user_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_generations_workspace_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_generations_conversation_created_at"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('MEMBER', 'OWNER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_invites_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "title" character varying(200) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ADD CONSTRAINT "FK_de21fcb2d1df7fd6ca70f555b6d" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_message_role_enum_old" AS ENUM('ASSISTANT', 'SYSTEM', 'TOOL', 'USER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ALTER COLUMN "role" TYPE "public"."ai_message_role_enum_old" USING "role"::"text"::"public"."ai_message_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_messages_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_message_role_enum_old" RENAME TO "ai_message_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "applied_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "applied_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "ai_generations" DROP COLUMN "model"`);
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "model" character varying(120) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "provider"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_provider_enum" AS ENUM('DEEPSEEK', 'GEMINI', 'OPENAI')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "provider" "public"."ai_provider_enum" NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generation_status_enum_old" AS ENUM('APPLIED', 'APPLY_BLOCKED', 'DISCARDED', 'FAILED', 'GENERATED', 'PROCESSING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" TYPE "public"."ai_generation_status_enum_old" USING "status"::"text"::"public"."ai_generation_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" SET DEFAULT 'PROCESSING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_generations_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generation_status_enum_old" RENAME TO "ai_generation_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "conversation_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_members_role_name_enum_old" AS ENUM('MEMBER', 'OWNER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_members_role_name_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_members_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workspace_members_role_name_enum_old" RENAME TO "workspace_members_role_name_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_members_membership_type_enum_old" AS ENUM('GUEST', 'MEMBER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "membership_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "membership_type" TYPE "public"."workspace_members_membership_type_enum_old" USING "membership_type"::"text"::"public"."workspace_members_membership_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "membership_type" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_members_membership_type_enum"`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."teamspaces_visibility_enum_old" RENAME TO "teamspaces_visibility_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."teamspace_members_role_name_enum_old" AS ENUM('MEMBER', 'OWNER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" TYPE "public"."teamspace_members_role_name_enum_old" USING "role_name"::"text"::"public"."teamspace_members_role_name_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."teamspace_members_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."teamspace_members_role_name_enum_old" RENAME TO "teamspace_members_role_name_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" DROP COLUMN "status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_conversations_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "error_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "input_data"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" DROP COLUMN "capability"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD "last_message_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "ai_messages" ADD "context" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "input_text" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "total_tokens" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "output_tokens" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "input_tokens" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "applied_results" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "input_context" jsonb`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generation_type_enum" AS ENUM('DASHBOARD_INSIGHT', 'PROJECT_DRAFT', 'TASK_DRAFT', 'WORKSPACE_DRAFT', 'WORKSPACE_TREE_DRAFT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "generation_type" "public"."ai_generation_type_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "sprint_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "ai_generations" ADD "board_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "project_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD "request_message_id" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_auth_identities_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_user_auth_identities_provider_issuer_subject_null_tenant"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_user_auth_identities_provider_issuer_subject_tenant"`,
    );
    await queryRunner.query(`DROP TABLE "user_auth_identities"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_usage_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_usage_workspace_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_usage_generation_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_usage_conversation_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_usage_created_at"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_usage_user_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_usage_workspace_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_usage_model_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "ai_usage"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_tool_calls_generation_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_tool_calls_tool_name"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_tool_calls_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ai_tool_calls_generation_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "ai_tool_calls"`);
    await queryRunner.query(`DROP TYPE "public"."ai_tool_calls_status_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_workspace_subscriptions_workspace_id" ON "workspace_subscriptions" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12fdbf99ca0da93085d61edd3b" ON "ai_conversations" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fcf70f986be86ca896e79f6387" ON "ai_conversations" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20e5179fc9877728266e207178" ON "ai_conversations" ("last_message_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de21fcb2d1df7fd6ca70f555b6" ON "ai_messages" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e869994cbb3a2904d5899c6359" ON "ai_messages" ("role") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb3c8c26d9f5bb2f8ba65f65ff" ON "ai_messages" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb6e402a34c7f5630dec84ffb4" ON "ai_generations" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2199c6831df88c3e9c978ea4b" ON "ai_generations" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1961f132b8336ebe3c790b9769" ON "ai_generations" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_96dab4a843462a64efacee5764" ON "ai_generations" ("project_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c635fff890316707be80cd148" ON "ai_generations" ("board_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e06136564da58c3394d700fc1a" ON "ai_generations" ("sprint_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f994835b1a547a72b4e45a9ffd" ON "ai_generations" ("status") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ADD CONSTRAINT "FK_a2199c6831df88c3e9c978ea4b5" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
