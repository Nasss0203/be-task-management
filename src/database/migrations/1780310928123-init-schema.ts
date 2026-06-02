import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1780310928123 implements MigrationInterface {
    name = 'InitSchema1780310928123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(100) NOT NULL, "name" character varying(150) NOT NULL, "description" text, "category" character varying(80), "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1552375559043d106dc9014c55" ON "features" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c0e1f5d0ba8027c186705d752b" ON "features" ("code") `);
        await queryRunner.query(`CREATE TABLE "plan_features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_eb2b32d1d93a8b2e96e122e3a77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_036c6f8f3800d80eca204293de" ON "plan_features" ("enabled") `);
        await queryRunner.query(`CREATE INDEX "IDX_27e866bdf4c6f2cf5854b7d0e5" ON "plan_features" ("feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b51952483b18fa15334d714a83" ON "plan_features" ("plan_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_03b01312e81d9165f8a2636b58" ON "plan_features" ("plan_id", "feature_id") `);
        await queryRunner.query(`CREATE TABLE "workspace_feature_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "feature_id" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "created_by" uuid, "updated_by" uuid, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_5d594450a26530ec47127a0d111" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8f3d24439be7ec018023fbafef" ON "workspace_feature_settings" ("enabled") `);
        await queryRunner.query(`CREATE INDEX "IDX_d05d2a5f46cd5768f2e63fd482" ON "workspace_feature_settings" ("feature_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e7d3027d64c7c874528d5080e2" ON "workspace_feature_settings" ("workspace_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe583d649a496665715c2a0c24" ON "workspace_feature_settings" ("workspace_id", "feature_id") `);
        await queryRunner.query(`ALTER TABLE "plan_features" ADD CONSTRAINT "FK_b51952483b18fa15334d714a838" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "plan_features" ADD CONSTRAINT "FK_27e866bdf4c6f2cf5854b7d0e57" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" ADD CONSTRAINT "FK_e7d3027d64c7c874528d5080e28" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" ADD CONSTRAINT "FK_d05d2a5f46cd5768f2e63fd4821" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" ADD CONSTRAINT "FK_87e1229bdfe77897adb4dafa583" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" ADD CONSTRAINT "FK_96ad4d782f2db292c0c5bd364b3" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" DROP CONSTRAINT "FK_96ad4d782f2db292c0c5bd364b3"`);
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" DROP CONSTRAINT "FK_87e1229bdfe77897adb4dafa583"`);
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" DROP CONSTRAINT "FK_d05d2a5f46cd5768f2e63fd4821"`);
        await queryRunner.query(`ALTER TABLE "workspace_feature_settings" DROP CONSTRAINT "FK_e7d3027d64c7c874528d5080e28"`);
        await queryRunner.query(`ALTER TABLE "plan_features" DROP CONSTRAINT "FK_27e866bdf4c6f2cf5854b7d0e57"`);
        await queryRunner.query(`ALTER TABLE "plan_features" DROP CONSTRAINT "FK_b51952483b18fa15334d714a838"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe583d649a496665715c2a0c24"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7d3027d64c7c874528d5080e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d05d2a5f46cd5768f2e63fd482"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f3d24439be7ec018023fbafef"`);
        await queryRunner.query(`DROP TABLE "workspace_feature_settings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_03b01312e81d9165f8a2636b58"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b51952483b18fa15334d714a83"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27e866bdf4c6f2cf5854b7d0e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_036c6f8f3800d80eca204293de"`);
        await queryRunner.query(`DROP TABLE "plan_features"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0e1f5d0ba8027c186705d752b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1552375559043d106dc9014c55"`);
        await queryRunner.query(`DROP TABLE "features"`);
    }

}
