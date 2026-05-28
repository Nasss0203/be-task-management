import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserActivities1777714870846 implements MigrationInterface {
  name = 'CreateUserActivities1777714870846';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_activity_type_enum" AS ENUM('LOGIN', 'OPEN_APP', 'OPEN_WORKSPACE', 'REFRESH_TOKEN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."user_activity_type_enum" NOT NULL DEFAULT 'OPEN_APP', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_activities_created_at" ON "user_activities" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_activities_user_id" ON "user_activities" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_activities" ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_activities" DROP CONSTRAINT "FK_a283f37e08edf5e37d38b375eec"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_activities_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_activities_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "user_activities"`);
    await queryRunner.query(`DROP TYPE "public"."user_activity_type_enum"`);
  }
}
