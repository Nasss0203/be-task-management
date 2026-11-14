import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCalendarFeeds1793857872144 implements MigrationInterface {
  name = 'CreateCalendarFeeds1793857872144';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"calendar_feeds\" (\"id\" uuid NOT NULL, \"database_id\" uuid NOT NULL, \"date_property_id\" uuid NOT NULL, \"created_by\" uuid NOT NULL, \"revoked_at\" TIMESTAMP WITH TIME ZONE, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_045067d8bb57f971f3c5426ea71\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE UNIQUE INDEX \"UQ_calendar_feeds_active\" ON \"calendar_feeds\" (\"database_id\", \"created_by\") WHERE \"revoked_at\" IS NULL");
    await runner.query("ALTER TABLE \"calendar_feeds\" ADD CONSTRAINT \"FK_aaece357b546c9e0c4c38371aa0\" FOREIGN KEY (\"database_id\") REFERENCES \"databases\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"calendar_feeds\" DROP CONSTRAINT \"FK_aaece357b546c9e0c4c38371aa0\"");
    await runner.query("DROP INDEX \"public\".\"UQ_calendar_feeds_active\"");
    await runner.query("DROP TABLE \"calendar_feeds\"");
  }
}
