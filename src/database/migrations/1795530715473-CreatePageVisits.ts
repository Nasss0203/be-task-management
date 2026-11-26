import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePageVisits1795530715473 implements MigrationInterface {
  name = 'CreatePageVisits1795530715473';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"page_visits\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"user_id\" uuid NOT NULL, \"page_id\" uuid NOT NULL, \"workspace_id\" uuid NOT NULL, \"visited_at\" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT \"UQ_page_visits_user_page\" UNIQUE (\"user_id\", \"page_id\"), CONSTRAINT \"PK_d09b1498521da41bd2cd21b11b8\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_page_visits_user_workspace_visited_at\" ON \"page_visits\" (\"user_id\", \"workspace_id\", \"visited_at\") ");
    await runner.query("ALTER TABLE \"page_visits\" ADD CONSTRAINT \"FK_2d44c60c8fcf8405b6a90a28681\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"page_visits\" ADD CONSTRAINT \"FK_ad610065787fcd533cfd1443037\" FOREIGN KEY (\"page_id\") REFERENCES \"pages\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"page_visits\" DROP CONSTRAINT \"FK_ad610065787fcd533cfd1443037\"");
    await runner.query("ALTER TABLE \"page_visits\" DROP CONSTRAINT \"FK_2d44c60c8fcf8405b6a90a28681\"");
    await runner.query("DROP INDEX \"public\".\"IDX_page_visits_user_workspace_visited_at\"");
    await runner.query("DROP TABLE \"page_visits\"");
  }
}
