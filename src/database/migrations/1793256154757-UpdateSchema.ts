import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1793256154757 implements MigrationInterface {
  name = 'UpdateSchema1793256154757';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_rows\" ADD \"parent_row_id\" uuid");
    await runner.query("CREATE INDEX \"IDX_DATABASE_ROWS_DATABASE_PARENT\" ON \"database_rows\" (\"database_id\", \"parent_row_id\") ");
    await runner.query("ALTER TABLE \"database_rows\" ADD CONSTRAINT \"FK_b8465e773e007001666f0459457\" FOREIGN KEY (\"parent_row_id\") REFERENCES \"database_rows\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_rows\" DROP CONSTRAINT \"FK_b8465e773e007001666f0459457\"");
    await runner.query("DROP INDEX \"public\".\"IDX_DATABASE_ROWS_DATABASE_PARENT\"");
    await runner.query("ALTER TABLE \"database_rows\" DROP COLUMN \"parent_row_id\"");
  }
}
