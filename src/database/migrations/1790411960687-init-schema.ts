import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1790411960687 implements MigrationInterface {
  name = 'InitSchema1790411960687';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`
  ALTER TABLE "workspace_members"
  DROP CONSTRAINT IF EXISTS "CHK_workspace_members_membership_type_role"
`);
    await queryRunner.query(
      `ALTER TYPE "public"."workspace_members_membership_type_enum" RENAME TO "workspace_members_membership_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_members_membership_type_enum" AS ENUM('GUEST', 'MEMBER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "membership_type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "membership_type" TYPE "public"."workspace_members_membership_type_enum" USING "membership_type"::"text"::"public"."workspace_members_membership_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ALTER COLUMN "membership_type" SET DEFAULT 'MEMBER'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_members_membership_type_enum_old"`,
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
    await queryRunner.query(`
  ALTER TABLE "workspace_members"
  ADD CONSTRAINT "CHK_workspace_members_membership_type_role"
  CHECK (
    (
      membership_type = 'GUEST'::workspace_members_membership_type_enum
      AND role_name IS NULL
    )
    OR
    (
      membership_type = 'MEMBER'::workspace_members_membership_type_enum
      AND role_name IS NOT NULL
    )
  )
`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_tool_calls_status_enum" RENAME TO "ai_tool_calls_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_tool_calls_status_enum" AS ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" ALTER COLUMN "status" TYPE "public"."ai_tool_calls_status_enum" USING "status"::"text"::"public"."ai_tool_calls_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_tool_calls_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generations_status_enum" RENAME TO "ai_generations_status_enum_old"`,
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
      `DROP TYPE "public"."ai_generations_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_messages_role_enum" RENAME TO "ai_messages_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_messages_role_enum" AS ENUM('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ALTER COLUMN "role" TYPE "public"."ai_messages_role_enum" USING "role"::"text"::"public"."ai_messages_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_messages_role_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_conversations_status_enum" RENAME TO "ai_conversations_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_conversations_status_enum" AS ENUM('ACTIVE', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "status" TYPE "public"."ai_conversations_status_enum" USING "status"::"text"::"public"."ai_conversations_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_conversations_status_enum_old"`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `CREATE TYPE "public"."ai_conversations_status_enum_old" AS ENUM('ACTIVE', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "status" TYPE "public"."ai_conversations_status_enum_old" USING "status"::"text"::"public"."ai_conversations_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_conversations_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."ai_conversations_status_enum_old" RENAME TO "ai_conversations_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_messages_role_enum_old" AS ENUM('ASSISTANT', 'SYSTEM', 'TOOL', 'USER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_messages" ALTER COLUMN "role" TYPE "public"."ai_messages_role_enum_old" USING "role"::"text"::"public"."ai_messages_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_messages_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_messages_role_enum_old" RENAME TO "ai_messages_role_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generations_status_enum_old" AS ENUM('APPLIED', 'COMPLETED', 'DISCARDED', 'FAILED', 'PROCESSING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" TYPE "public"."ai_generations_status_enum_old" USING "status"::"text"::"public"."ai_generations_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" SET DEFAULT 'PROCESSING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_generations_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generations_status_enum_old" RENAME TO "ai_generations_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_tool_calls_status_enum_old" AS ENUM('FAILED', 'PENDING', 'RUNNING', 'SUCCEEDED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" ALTER COLUMN "status" TYPE "public"."ai_tool_calls_status_enum_old" USING "status"::"text"::"public"."ai_tool_calls_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_tool_calls" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_tool_calls_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_tool_calls_status_enum_old" RENAME TO "ai_tool_calls_status_enum"`,
    );
    await queryRunner.query(`
  ALTER TABLE "workspace_members"
  DROP CONSTRAINT IF EXISTS "CHK_workspace_members_membership_type_role"
`);
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
      `ALTER TYPE "public"."workspace_members_membership_type_enum_old" RENAME TO "workspace_members_membership_type_enum"`,
    );
    await queryRunner.query(`
  ALTER TABLE "workspace_members"
  ADD CONSTRAINT "CHK_workspace_members_membership_type_role"
  CHECK (
    (
      membership_type = 'GUEST'::workspace_members_membership_type_enum
      AND role_name IS NULL
    )
    OR
    (
      membership_type = 'MEMBER'::workspace_members_membership_type_enum
      AND role_name IS NOT NULL
    )
  )
`);
    await queryRunner.query(
      `CREATE TYPE "public"."teamspaces_visibility_enum_old" AS ENUM('OPEN', 'PRIVATE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspaces" ALTER COLUMN "visibility" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspaces" ALTER COLUMN "visibility" TYPE "public"."teamspaces_visibility_enum_old" USING "visibility"::"text"::"public"."teamspaces_visibility_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teamspaces" ALTER COLUMN "visibility" SET DEFAULT 'OPEN'`,
    );
    await queryRunner.query(`DROP TYPE "public"."teamspaces_visibility_enum"`);
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
  }
}
