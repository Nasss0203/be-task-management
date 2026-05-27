import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1779260878686 implements MigrationInterface {
  name = 'InitSchema1779260878686';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_66e758f1718149c6d39f94d351"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "plan_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "period_start" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "period_end" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "plan_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "target_workspace_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "order_code" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "provider_order_id" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "provider_request_id" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "provider_transaction_id" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_payment_method_enum" AS ENUM('QR', 'ATM', 'VISA', 'BANK_TRANSFER', 'WALLET', 'UNKNOWN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "payment_method" "public"."payments_payment_method_enum" NOT NULL DEFAULT 'UNKNOWN'`,
    );
    await queryRunner.query(`ALTER TABLE "payments" ADD "payment_url" text`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "expired_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" ADD "target_workspace_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" ADD "order_code" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" ADD "provider_transaction_id" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" DROP CONSTRAINT "UQ_e7b71bb444e74ee067df057397e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e80d5a85da612468d8158f506"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_provider_enum" RENAME TO "subscriptions_provider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_provider_enum" AS ENUM('MANUAL', 'MOMO', 'VNPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "provider" TYPE "public"."subscriptions_provider_enum" USING "provider"::"text"::"public"."subscriptions_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_provider_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "UQ_d8f8d3788694e1b3f96c42c36fb"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payments_provider_enum" RENAME TO "payments_provider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_provider_enum" AS ENUM('MANUAL', 'MOMO', 'VNPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" TYPE "public"."payments_provider_enum" USING "provider"::"text"::"public"."payments_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_provider_enum_old"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f7b512cb530d7ecbf1bc11140"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."billing_webhooks_provider_enum" RENAME TO "billing_webhooks_provider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."billing_webhooks_provider_enum" AS ENUM('MANUAL', 'MOMO', 'VNPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" ALTER COLUMN "provider" TYPE "public"."billing_webhooks_provider_enum" USING "provider"::"text"::"public"."billing_webhooks_provider_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."billing_webhooks_provider_enum_old"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e80d5a85da612468d8158f506" ON "subscriptions" ("provider", "provider_subscription_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a15756e257e0eaf01edc85645" ON "subscriptions" ("user_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_08521b1e94fa456ac57f335485" ON "invoices" ("plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_712cfa59a1a682053302be2383" ON "payments" ("provider", "provider_transaction_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27a9e16a54dda9e69d7555d5a5" ON "payments" ("provider", "provider_request_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37eacc018c6ab6e3b033df34e9" ON "payments" ("provider", "provider_order_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_87606cc142b1a15c00445b647f" ON "payments" ("order_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_30ab3d7a27e024409d8409601a" ON "payments" ("target_workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9b6a4c3196864cdd91b1a440e" ON "payments" ("plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_485f1bffef86b5fa73e7c8ade7" ON "billing_webhooks" ("target_workspace_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2f7b512cb530d7ecbf1bc11140" ON "billing_webhooks" ("provider", "provider_event_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_08521b1e94fa456ac57f335485f" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_f9b6a4c3196864cdd91b1a440ee" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_30ab3d7a27e024409d8409601af" FOREIGN KEY ("target_workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" ADD CONSTRAINT "FK_485f1bffef86b5fa73e7c8ade7f" FOREIGN KEY ("target_workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" DROP CONSTRAINT "FK_485f1bffef86b5fa73e7c8ade7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_30ab3d7a27e024409d8409601af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_f9b6a4c3196864cdd91b1a440ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_08521b1e94fa456ac57f335485f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f7b512cb530d7ecbf1bc11140"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_485f1bffef86b5fa73e7c8ade7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9b6a4c3196864cdd91b1a440e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_30ab3d7a27e024409d8409601a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87606cc142b1a15c00445b647f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_37eacc018c6ab6e3b033df34e9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27a9e16a54dda9e69d7555d5a5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_712cfa59a1a682053302be2383"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08521b1e94fa456ac57f335485"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1a15756e257e0eaf01edc85645"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e80d5a85da612468d8158f506"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."billing_webhooks_provider_enum_old" AS ENUM('MANUAL', 'VISA', 'MOMO', 'VNPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" ALTER COLUMN "provider" TYPE "public"."billing_webhooks_provider_enum_old" USING "provider"::"text"::"public"."billing_webhooks_provider_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."billing_webhooks_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."billing_webhooks_provider_enum_old" RENAME TO "billing_webhooks_provider_enum"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2f7b512cb530d7ecbf1bc11140" ON "billing_webhooks" ("provider", "provider_event_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_provider_enum_old" AS ENUM('MANUAL', 'VISA', 'MOMO', 'VNPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" TYPE "public"."payments_provider_enum_old" USING "provider"::"text"::"public"."payments_provider_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(`DROP TYPE "public"."payments_provider_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payments_provider_enum_old" RENAME TO "payments_provider_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "UQ_d8f8d3788694e1b3f96c42c36fb" UNIQUE ("invoice_number")`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_provider_enum_old" AS ENUM('MANUAL', 'VISA', 'MOMO', 'VNPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "provider" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "provider" TYPE "public"."subscriptions_provider_enum_old" USING "provider"::"text"::"public"."subscriptions_provider_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "provider" SET DEFAULT 'MANUAL'`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_provider_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_provider_enum_old" RENAME TO "subscriptions_provider_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e80d5a85da612468d8158f506" ON "subscriptions" ("provider", "provider_subscription_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "plans" ADD CONSTRAINT "UQ_e7b71bb444e74ee067df057397e" UNIQUE ("slug")`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" DROP COLUMN "provider_transaction_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" DROP COLUMN "order_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_webhooks" DROP COLUMN "target_workspace_id"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "expired_at"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payment_url"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "payment_method"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."payments_payment_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "provider_transaction_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "provider_request_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "provider_order_id"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "order_code"`);
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "target_workspace_id"`,
    );
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "plan_id"`);
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "period_end"`);
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP COLUMN "period_start"`,
    );
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "plan_id"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_66e758f1718149c6d39f94d351" ON "payments" ("provider", "provider_payment_id") `,
    );
  }
}
