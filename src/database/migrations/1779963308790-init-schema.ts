import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1779963308790 implements MigrationInterface {
    name = 'InitSchema1779963308790'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subscription_workspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "activated_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0e797c417ac210a632baea85bf2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_75b5f60c57b4b668f9bb6f2fdd" ON "subscription_workspaces" ("subscription_id", "workspace_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c6df002c443d02785a425c08c" ON "subscription_workspaces" ("workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8986405225cf7db3310b27ff88" ON "subscription_workspaces" ("subscription_id") `);
        await queryRunner.query(`CREATE TYPE "public"."user_activity_type_enum" AS ENUM('LOGIN', 'OPEN_APP', 'OPEN_WORKSPACE', 'REFRESH_TOKEN')`);
        await queryRunner.query(`CREATE TABLE "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."user_activity_type_enum" NOT NULL DEFAULT 'OPEN_APP', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_user_activities_created_at" ON "user_activities" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_activities_user_id" ON "user_activities" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "subscription_workspaces" ADD CONSTRAINT "FK_8986405225cf7db3310b27ff885" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscription_workspaces" ADD CONSTRAINT "FK_9c6df002c443d02785a425c08c9" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_a283f37e08edf5e37d38b375eec"`);
        await queryRunner.query(`ALTER TABLE "subscription_workspaces" DROP CONSTRAINT "FK_9c6df002c443d02785a425c08c9"`);
        await queryRunner.query(`ALTER TABLE "subscription_workspaces" DROP CONSTRAINT "FK_8986405225cf7db3310b27ff885"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_activities_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_activities_created_at"`);
        await queryRunner.query(`DROP TABLE "user_activities"`);
        await queryRunner.query(`DROP TYPE "public"."user_activity_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8986405225cf7db3310b27ff88"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c6df002c443d02785a425c08c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_75b5f60c57b4b668f9bb6f2fdd"`);
        await queryRunner.query(`DROP TABLE "subscription_workspaces"`);
    }

}
