import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreatorProfiles1792423034264 implements MigrationInterface {
  name = 'CreateCreatorProfiles1792423034264';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"creator_profiles\" (\"user_id\" uuid NOT NULL, \"handle\" character varying(30) NOT NULL, \"display_name\" character varying(60), \"headline\" character varying(120), \"bio\" character varying(1000), \"website_url\" character varying(255), \"x_url\" character varying(255), \"github_url\" character varying(255), \"linkedin_url\" character varying(255), \"youtube_url\" character varying(255), \"facebook_url\" character varying(255), \"avatar_key\" character varying(500), \"cover_key\" character varying(500), \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL, \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT \"UQ_creator_profiles_handle\" UNIQUE (\"handle\"), CONSTRAINT \"CHK_creator_profiles_handle\" CHECK (\"handle\" ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$'), CONSTRAINT \"PK_creator_profiles\" PRIMARY KEY (\"user_id\"))");
    await runner.query("ALTER TABLE \"creator_profiles\" ADD CONSTRAINT \"FK_creator_profiles_user\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"creator_profiles\" DROP CONSTRAINT \"FK_creator_profiles_user\"");
    await runner.query("DROP TABLE \"creator_profiles\"");
  }
}
