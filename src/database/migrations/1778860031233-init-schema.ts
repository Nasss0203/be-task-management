<<<<<<< HEAD
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1778860031233 implements MigrationInterface {
    name = 'InitSchema1778860031233'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "display_name" character varying(150), "full_name" character varying(150), "bio" text, "phone_number" character varying(30), "location" character varying(150), "job_title" character varying(150), "website" character varying(255), "cover_url" character varying(500), "timezone" character varying(50), "language" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6ca9503d77ae39b4b5a6cc3ba88" UNIQUE ("user_id"), CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_system_role_enum" AS ENUM('USER', 'SYSTEM_ADMIN', 'SUPER_ADMIN')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "system_role" "public"."users_system_role_enum" NOT NULL DEFAULT 'USER'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "system_role"`);
        await queryRunner.query(`DROP TYPE "public"."users_system_role_enum"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }

=======
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1778860031233 implements MigrationInterface {
  name = 'InitSchema1778860031233';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "display_name" character varying(150),
        "full_name" character varying(150),
        "bio" text,
        "phone_number" character varying(30),
        "location" character varying(150),
        "job_title" character varying(150),
        "website" character varying(255),
        "cover_url" character varying(500),
        "timezone" character varying(50),
        "language" character varying(20),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_6ca9503d77ae39b4b5a6cc3ba88" UNIQUE ("user_id"),
        CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"),
        CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_system_role_enum" AS ENUM('USER', 'SYSTEM_ADMIN', 'SUPER_ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "system_role" "public"."users_system_role_enum" NOT NULL DEFAULT 'USER'
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "user_profiles"
        ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "system_role"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);
  }
>>>>>>> admin
}
