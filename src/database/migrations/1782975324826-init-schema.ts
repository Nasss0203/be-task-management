import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1782975324826 implements MigrationInterface {
  name = 'InitSchema1782975324826';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "title" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "title" SET DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "title" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ALTER COLUMN "title" SET NOT NULL`,
    );
  }
}
