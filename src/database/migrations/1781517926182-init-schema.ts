import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1781517926182 implements MigrationInterface {
    name = 'InitSchema1781517926182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_4e80d5a85da612468d8158f506"`);
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_provider_enum" RENAME TO "subscriptions_provider_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_provider_enum" AS ENUM('MANUAL', 'MOMO', 'VNPAY', 'STRIPE')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "provider" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "provider" TYPE "public"."subscriptions_provider_enum" USING "provider"::"text"::"public"."subscriptions_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_provider_enum_old"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_712cfa59a1a682053302be2383"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27a9e16a54dda9e69d7555d5a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37eacc018c6ab6e3b033df34e9"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_provider_enum" RENAME TO "payments_provider_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_provider_enum" AS ENUM('MANUAL', 'MOMO', 'VNPAY', 'STRIPE')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" TYPE "public"."payments_provider_enum" USING "provider"::"text"::"public"."payments_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`);
        await queryRunner.query(`DROP TYPE "public"."payments_provider_enum_old"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f7b512cb530d7ecbf1bc11140"`);
        await queryRunner.query(`ALTER TYPE "public"."billing_webhooks_provider_enum" RENAME TO "billing_webhooks_provider_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."billing_webhooks_provider_enum" AS ENUM('MANUAL', 'MOMO', 'VNPAY', 'STRIPE')`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ALTER COLUMN "provider" TYPE "public"."billing_webhooks_provider_enum" USING "provider"::"text"::"public"."billing_webhooks_provider_enum"`);
        await queryRunner.query(`DROP TYPE "public"."billing_webhooks_provider_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_4e80d5a85da612468d8158f506" ON "subscriptions" ("provider", "provider_subscription_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_712cfa59a1a682053302be2383" ON "payments" ("provider", "provider_transaction_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_27a9e16a54dda9e69d7555d5a5" ON "payments" ("provider", "provider_request_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_37eacc018c6ab6e3b033df34e9" ON "payments" ("provider", "provider_order_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2f7b512cb530d7ecbf1bc11140" ON "billing_webhooks" ("provider", "provider_event_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2f7b512cb530d7ecbf1bc11140"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37eacc018c6ab6e3b033df34e9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27a9e16a54dda9e69d7555d5a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_712cfa59a1a682053302be2383"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e80d5a85da612468d8158f506"`);
        await queryRunner.query(`CREATE TYPE "public"."billing_webhooks_provider_enum_old" AS ENUM('MANUAL', 'MOMO', 'VNPAY')`);
        await queryRunner.query(`ALTER TABLE "billing_webhooks" ALTER COLUMN "provider" TYPE "public"."billing_webhooks_provider_enum_old" USING "provider"::"text"::"public"."billing_webhooks_provider_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."billing_webhooks_provider_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."billing_webhooks_provider_enum_old" RENAME TO "billing_webhooks_provider_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2f7b512cb530d7ecbf1bc11140" ON "billing_webhooks" ("provider", "provider_event_id") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_provider_enum_old" AS ENUM('MANUAL', 'MOMO', 'VNPAY')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" TYPE "public"."payments_provider_enum_old" USING "provider"::"text"::"public"."payments_provider_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`);
        await queryRunner.query(`DROP TYPE "public"."payments_provider_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_provider_enum_old" RENAME TO "payments_provider_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_37eacc018c6ab6e3b033df34e9" ON "payments" ("provider", "provider_order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_27a9e16a54dda9e69d7555d5a5" ON "payments" ("provider", "provider_request_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_712cfa59a1a682053302be2383" ON "payments" ("provider", "provider_transaction_id") `);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_provider_enum_old" AS ENUM('MANUAL', 'MOMO', 'VNPAY')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "provider" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "provider" TYPE "public"."subscriptions_provider_enum_old" USING "provider"::"text"::"public"."subscriptions_provider_enum_old"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_provider_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_provider_enum_old" RENAME TO "subscriptions_provider_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_4e80d5a85da612468d8158f506" ON "subscriptions" ("provider", "provider_subscription_id") `);
    }

}
