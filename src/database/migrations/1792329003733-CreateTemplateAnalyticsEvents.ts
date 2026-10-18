import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateAnalyticsEvents1792329003733 implements MigrationInterface {
  name = 'CreateTemplateAnalyticsEvents1792329003733';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"template_analytics_events\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"template_id\" uuid NOT NULL, \"version_id\" uuid, \"event_type\" character varying(16) NOT NULL, \"user_id\" uuid, \"source_id\" uuid, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"UQ_template_analytics_events_source\" UNIQUE (\"source_id\"), CONSTRAINT \"CHK_template_analytics_events_use_source\" CHECK ((\"event_type\" = 'USE' AND \"source_id\" IS NOT NULL AND \"version_id\" IS NOT NULL) OR (\"event_type\" <> 'USE' AND \"source_id\" IS NULL)), CONSTRAINT \"CHK_template_analytics_events_event_type\" CHECK (\"event_type\" IN ('VIEW', 'USE')), CONSTRAINT \"PK_template_analytics_events\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_template_analytics_events_version_id\" ON \"template_analytics_events\" (\"version_id\") ");
    await runner.query("CREATE INDEX \"IDX_template_analytics_events_template_type_created_at\" ON \"template_analytics_events\" (\"template_id\", \"event_type\", \"created_at\") ");
    await runner.query("ALTER TABLE \"template_analytics_events\" ADD CONSTRAINT \"FK_template_analytics_events_template\" FOREIGN KEY (\"template_id\") REFERENCES \"page_templates\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"template_analytics_events\" ADD CONSTRAINT \"FK_template_analytics_events_version_template\" FOREIGN KEY (\"version_id\", \"template_id\") REFERENCES \"page_template_versions\"(\"id\",\"template_id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"template_analytics_events\" ADD CONSTRAINT \"FK_template_analytics_events_user\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"template_analytics_events\" DROP CONSTRAINT \"FK_template_analytics_events_user\"");
    await runner.query("ALTER TABLE \"template_analytics_events\" DROP CONSTRAINT \"FK_template_analytics_events_version_template\"");
    await runner.query("ALTER TABLE \"template_analytics_events\" DROP CONSTRAINT \"FK_template_analytics_events_template\"");
    await runner.query("DROP INDEX \"public\".\"IDX_template_analytics_events_template_type_created_at\"");
    await runner.query("DROP INDEX \"public\".\"IDX_template_analytics_events_version_id\"");
    await runner.query("DROP TABLE \"template_analytics_events\"");
  }
}
