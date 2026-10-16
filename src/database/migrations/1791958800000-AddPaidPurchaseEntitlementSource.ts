import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaidPurchaseEntitlementSource1791958800000 implements MigrationInterface {
  name = 'AddPaidPurchaseEntitlementSource1791958800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."template_entitlements_source_enum"
      ADD VALUE IF NOT EXISTS 'PAID_PURCHASE'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: { count: string }[] = await queryRunner.query(`
      SELECT COUNT(*)::text AS count
      FROM "public"."template_entitlements"
      WHERE "source"::text = 'PAID_PURCHASE'
    `);

    if (Number(rows[0]?.count ?? 0) > 0) {
      throw new Error(
        'Cannot rollback: PAID_PURCHASE entitlements already exist',
      );
    }

    await queryRunner.query(`
      ALTER TYPE "public"."template_entitlements_source_enum"
      RENAME TO "template_entitlements_source_enum_old"
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."template_entitlements_source_enum"
      AS ENUM ('FREE_CLAIM')
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."template_entitlements"
      ALTER COLUMN "source" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."template_entitlements"
      ALTER COLUMN "source"
      TYPE "public"."template_entitlements_source_enum"
      USING "source"::text::"public"."template_entitlements_source_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "public"."template_entitlements"
      ALTER COLUMN "source" SET DEFAULT 'FREE_CLAIM'
    `);

    await queryRunner.query(`
      DROP TYPE "public"."template_entitlements_source_enum_old"
    `);
  }
}
