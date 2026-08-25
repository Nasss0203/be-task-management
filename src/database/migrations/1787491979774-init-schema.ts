import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1787491979774 implements MigrationInterface {
    name = 'InitSchema1787491979774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "page_blocks" DROP CONSTRAINT "FK_PAGE_BLOCKS_PARENT_BLOCK"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_name_enum" RENAME TO "workspace_members_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum" USING "role_name"::"text"::"public"."workspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."page_blocks_type_enum" RENAME TO "page_blocks_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."page_blocks_type_enum" AS ENUM('TEXT', 'HEADER', 'QUOTE', 'DIVIDER', 'CODE', 'TODO', 'IMAGE', 'VIDEO', 'FILE', 'BOOKMARK', 'EMBED', 'FIGMA', 'GITHUB_GIST', 'GOOGLE_MAPS', 'TWEET', 'DATABASE_VIEW', 'TABLE_SIMPLE', 'MERMAID', 'BUTTON', 'TOGGLE')`);
        await queryRunner.query(`ALTER TABLE "page_blocks" ALTER COLUMN "type" TYPE "public"."page_blocks_type_enum" USING "type"::"text"::"public"."page_blocks_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."page_blocks_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum" RENAME TO "workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "page_blocks" ADD CONSTRAINT "FK_8dc937f145998715b5d715080e1" FOREIGN KEY ("parent_block_id") REFERENCES "page_blocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "page_blocks" DROP CONSTRAINT "FK_8dc937f145998715b5d715080e1"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."page_blocks_type_enum_old" AS ENUM('TEXT', 'HEADER', 'QUOTE', 'DIVIDER', 'CODE', 'TODO', 'IMAGE', 'VIDEO', 'FILE', 'BOOKMARK', 'EMBED', 'FIGMA', 'GITHUB_GIST', 'GOOGLE_MAPS', 'TWEET', 'DATABASE_VIEW', 'TABLE_SIMPLE', 'MERMAID', 'BUTTON')`);
        await queryRunner.query(`ALTER TABLE "page_blocks" ALTER COLUMN "type" TYPE "public"."page_blocks_type_enum_old" USING "type"::"text"::"public"."page_blocks_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."page_blocks_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."page_blocks_type_enum_old" RENAME TO "page_blocks_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum_old" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_name_enum_old" RENAME TO "workspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "page_blocks" ADD CONSTRAINT "FK_PAGE_BLOCKS_PARENT_BLOCK" FOREIGN KEY ("parent_block_id") REFERENCES "page_blocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
