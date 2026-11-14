import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGoogleCalendarConnections1793871078264 implements MigrationInterface {
  name = 'CreateGoogleCalendarConnections1793871078264';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"google_calendar_connections\" (\"id\" uuid NOT NULL, \"user_id\" uuid NOT NULL, \"google_email\" character varying(320) NOT NULL, \"refresh_token_encrypted\" text NOT NULL, \"last_error\" character varying(64), \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_f29d378395c3b475dad50246f9b\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE UNIQUE INDEX \"UQ_google_calendar_connections_user\" ON \"google_calendar_connections\" (\"user_id\") ");
    await runner.query("CREATE TABLE \"google_calendar_syncs\" (\"id\" uuid NOT NULL, \"connection_id\" uuid NOT NULL, \"database_id\" uuid NOT NULL, \"date_property_id\" uuid NOT NULL, \"google_calendar_id\" character varying(255) NOT NULL, \"last_synced_at\" TIMESTAMP WITH TIME ZONE, \"last_error\" character varying(64), \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_1f798e62927e7449e78602bb53d\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE UNIQUE INDEX \"UQ_google_calendar_syncs_connection_database\" ON \"google_calendar_syncs\" (\"connection_id\", \"database_id\") ");
    await runner.query("ALTER TABLE \"google_calendar_connections\" ADD CONSTRAINT \"FK_5d86efafe932eea9abc9cbac3e8\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"google_calendar_syncs\" ADD CONSTRAINT \"FK_3a3f07ae19f17f536d26bb1dac8\" FOREIGN KEY (\"connection_id\") REFERENCES \"google_calendar_connections\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"google_calendar_syncs\" ADD CONSTRAINT \"FK_57f605e648406b757e67135e367\" FOREIGN KEY (\"database_id\") REFERENCES \"databases\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"google_calendar_syncs\" DROP CONSTRAINT \"FK_57f605e648406b757e67135e367\"");
    await runner.query("ALTER TABLE \"google_calendar_syncs\" DROP CONSTRAINT \"FK_3a3f07ae19f17f536d26bb1dac8\"");
    await runner.query("ALTER TABLE \"google_calendar_connections\" DROP CONSTRAINT \"FK_5d86efafe932eea9abc9cbac3e8\"");
    await runner.query("DROP INDEX \"public\".\"UQ_google_calendar_syncs_connection_database\"");
    await runner.query("DROP TABLE \"google_calendar_syncs\"");
    await runner.query("DROP INDEX \"public\".\"UQ_google_calendar_connections_user\"");
    await runner.query("DROP TABLE \"google_calendar_connections\"");
  }
}
