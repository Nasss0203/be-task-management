import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1778256711740 implements MigrationInterface {
    name = 'InitSchema1778256711740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_029d141be7ee764c2465186539"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ccd725eebd8cb880344f32a51a"`);
        await queryRunner.query(`ALTER TABLE "invoices" RENAME COLUMN "workspace_id" TO "user_id"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "workspace_id" TO "user_id"`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_provider_enum" AS ENUM('MANUAL', 'VISA', 'MOMO', 'VNPAY')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'INCOMPLETE')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "plan_id" uuid NOT NULL, "provider" "public"."subscriptions_provider_enum" NOT NULL DEFAULT 'MANUAL', "provider_subscription_id" character varying(255), "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE', "current_period_start" TIMESTAMP, "current_period_end" TIMESTAMP, "trial_end" TIMESTAMP, "cancel_at_period_end" boolean NOT NULL DEFAULT false, "cancelled_at" TIMESTAMP, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4e80d5a85da612468d8158f506" ON "subscriptions" ("provider", "provider_subscription_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ccf973355b70645eff37774de" ON "subscriptions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_e45fca5d912c3a2fab512ac25d" ON "subscriptions" ("plan_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d0a95ef8a28188364c546eb65c" ON "subscriptions" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD "subscription_id" uuid`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD "payment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD "invoice_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_26daf5e433d6fb88ee32ce9363" ON "invoices" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_427785468fb7d2733f59e7d7d3" ON "payments" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b4538478c6b35954cf27d206f6" ON "billing_webhooks" ("invoice_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_31d512028f7ffceaaedcbe42fa" ON "billing_webhooks" ("payment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f086d4a8a01aaf7a8178860af1" ON "billing_webhooks" ("subscription_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace5ca855a1e27c42242781304" ON "billing_webhooks" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_26daf5e433d6fb88ee32ce93637" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_75848dfef07fd19027e08ca81d2" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_563a5e248518c623eebd987d43e" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD CONSTRAINT "FK_ace5ca855a1e27c42242781304e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD CONSTRAINT "FK_f086d4a8a01aaf7a8178860af1d" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD CONSTRAINT "FK_31d512028f7ffceaaedcbe42fa4" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ADD CONSTRAINT "FK_b4538478c6b35954cf27d206f63" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_limits" ADD CONSTRAINT "FK_5181cfb598d266c5a979fcf1150" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usage_limits" ADD CONSTRAINT "FK_176541ede12e93282f7d3001f56" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usage_limits" DROP CONSTRAINT "FK_176541ede12e93282f7d3001f56"`);
        await queryRunner.query(`ALTER TABLE "usage_limits" DROP CONSTRAINT "FK_5181cfb598d266c5a979fcf1150"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP CONSTRAINT "FK_b4538478c6b35954cf27d206f63"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP CONSTRAINT "FK_31d512028f7ffceaaedcbe42fa4"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP CONSTRAINT "FK_f086d4a8a01aaf7a8178860af1d"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP CONSTRAINT "FK_ace5ca855a1e27c42242781304e"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_563a5e248518c623eebd987d43e"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_75848dfef07fd19027e08ca81d2"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_5152c0aa0f851d9b95972b442e0"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_26daf5e433d6fb88ee32ce93637"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace5ca855a1e27c42242781304"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f086d4a8a01aaf7a8178860af1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_31d512028f7ffceaaedcbe42fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b4538478c6b35954cf27d206f6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_427785468fb7d2733f59e7d7d3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_26daf5e433d6fb88ee32ce9363"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP COLUMN "invoice_id"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP COLUMN "payment_id"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP COLUMN "subscription_id"`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" DROP COLUMN "user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0a95ef8a28188364c546eb65c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e45fca5d912c3a2fab512ac25d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ccf973355b70645eff37774de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e80d5a85da612468d8158f506"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "user_id" TO "workspace_id"`);
        await queryRunner.query(`ALTER TABLE "invoices" RENAME COLUMN "user_id" TO "workspace_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_ccd725eebd8cb880344f32a51a" ON "payments" ("workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_029d141be7ee764c2465186539" ON "invoices" ("workspace_id") `);
    }

}
