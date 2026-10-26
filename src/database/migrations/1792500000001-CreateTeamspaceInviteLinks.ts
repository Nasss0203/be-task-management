import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamspaceInviteLinks1792500000001 implements MigrationInterface {
  name = 'CreateTeamspaceInviteLinks1792500000001';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE "teamspace_invite_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "teamspace_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "created_by" uuid,
        "expires_at" timestamptz NOT NULL,
        "max_uses" integer,
        "use_count" integer NOT NULL DEFAULT 0,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teamspace_invite_links" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_teamspace_invite_links_use_count" CHECK ("use_count" >= 0),
        CONSTRAINT "CHK_teamspace_invite_links_max_uses" CHECK ("max_uses" IS NULL OR "max_uses" > 0),
        CONSTRAINT "CHK_teamspace_invite_links_limit" CHECK ("max_uses" IS NULL OR "use_count" <= "max_uses")
      )
    `);
    await runner.query(`CREATE UNIQUE INDEX "UQ_teamspace_invite_links_token_hash" ON "teamspace_invite_links" ("token_hash")`);
    await runner.query(`CREATE INDEX "IDX_teamspace_invite_links_teamspace_created" ON "teamspace_invite_links" ("teamspace_id", "created_at")`);
    await runner.query(`ALTER TABLE "teamspace_invite_links" ADD CONSTRAINT "FK_teamspace_invite_links_teamspace" FOREIGN KEY ("teamspace_id") REFERENCES "teamspaces"("id") ON DELETE CASCADE`);
    await runner.query(`ALTER TABLE "teamspace_invite_links" ADD CONSTRAINT "FK_teamspace_invite_links_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "teamspace_invite_links" DROP CONSTRAINT "FK_teamspace_invite_links_creator"`);
    await runner.query(`ALTER TABLE "teamspace_invite_links" DROP CONSTRAINT "FK_teamspace_invite_links_teamspace"`);
    await runner.query(`DROP INDEX "IDX_teamspace_invite_links_teamspace_created"`);
    await runner.query(`DROP INDEX "UQ_teamspace_invite_links_token_hash"`);
    await runner.query(`DROP TABLE "teamspace_invite_links"`);
  }
}
