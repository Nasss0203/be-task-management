import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiAskEvents1793446665938 implements MigrationInterface {
  name = 'CreateAiAskEvents1793446665938';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"ai_ask_events\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"kind\" character varying(20) NOT NULL, \"user_id\" uuid NOT NULL, \"workspace_id\" uuid NOT NULL, \"request_id\" character varying(100), \"intent\" character varying(30), \"status\" character varying(40) NOT NULL, \"reason\" character varying(60), \"reference_type\" character varying(20), \"resolution_method\" character varying(30), \"candidate_count\" smallint, \"flags\" jsonb NOT NULL DEFAULT '{}', \"capability\" character varying(80), \"generation_id\" uuid, \"duration_ms\" integer NOT NULL, \"error_code\" character varying(40), \"instruction\" character varying(300), \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_ai_ask_events\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_ai_ask_events_created_at\" ON \"ai_ask_events\" (\"created_at\") ");
    await runner.query("CREATE INDEX \"IDX_ai_ask_events_workspace_created_at\" ON \"ai_ask_events\" (\"workspace_id\", \"created_at\") ");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"IDX_ai_ask_events_workspace_created_at\"");
    await runner.query("DROP INDEX \"public\".\"IDX_ai_ask_events_created_at\"");
    await runner.query("DROP TABLE \"ai_ask_events\"");
  }
}
