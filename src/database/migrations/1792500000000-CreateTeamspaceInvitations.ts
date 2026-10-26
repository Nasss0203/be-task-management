import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamspaceInvitations1792500000000 implements MigrationInterface {
  name = 'CreateTeamspaceInvitations1792500000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE "teamspace_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "teamspace_id" uuid NOT NULL,
        "workspace_member_id" uuid NOT NULL,
        "invited_by" uuid,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "expires_at" timestamptz NOT NULL,
        "accepted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teamspace_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_teamspace_invitations_status" CHECK ("status" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED'))
      )
    `);
    await runner.query(`CREATE INDEX "IDX_teamspace_invitations_recipient" ON "teamspace_invitations" ("workspace_member_id", "created_at")`);
    await runner.query(`CREATE UNIQUE INDEX "UQ_teamspace_invitations_pending" ON "teamspace_invitations" ("teamspace_id", "workspace_member_id") WHERE "status" = 'PENDING'`);
    await runner.query(`ALTER TABLE "teamspace_invitations" ADD CONSTRAINT "FK_teamspace_invitations_teamspace" FOREIGN KEY ("teamspace_id") REFERENCES "teamspaces"("id") ON DELETE CASCADE`);
    await runner.query(`ALTER TABLE "teamspace_invitations" ADD CONSTRAINT "FK_teamspace_invitations_recipient" FOREIGN KEY ("workspace_member_id") REFERENCES "workspace_members"("id") ON DELETE CASCADE`);
    await runner.query(`ALTER TABLE "teamspace_invitations" ADD CONSTRAINT "FK_teamspace_invitations_inviter" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "teamspace_invitations" DROP CONSTRAINT "FK_teamspace_invitations_inviter"`);
    await runner.query(`ALTER TABLE "teamspace_invitations" DROP CONSTRAINT "FK_teamspace_invitations_recipient"`);
    await runner.query(`ALTER TABLE "teamspace_invitations" DROP CONSTRAINT "FK_teamspace_invitations_teamspace"`);
    await runner.query(`DROP INDEX "UQ_teamspace_invitations_pending"`);
    await runner.query(`DROP INDEX "IDX_teamspace_invitations_recipient"`);
    await runner.query(`DROP TABLE "teamspace_invitations"`);
  }
}
