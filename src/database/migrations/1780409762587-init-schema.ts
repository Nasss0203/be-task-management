import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1780409762587 implements MigrationInterface {
    name = 'InitSchema1780409762587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workspaces_layout_mode_enum" AS ENUM('tabs', 'blocks')`);
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "layout_mode" "public"."workspaces_layout_mode_enum" NOT NULL DEFAULT 'tabs'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "layout_mode"`);
        await queryRunner.query(`DROP TYPE "public"."workspaces_layout_mode_enum"`);
    }

}
