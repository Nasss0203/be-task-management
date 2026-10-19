import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateLikes1792420815933 implements MigrationInterface {
  name = 'CreateTemplateLikes1792420815933';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"template_likes\" (\"template_id\" uuid NOT NULL, \"user_id\" uuid NOT NULL, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_template_likes\" PRIMARY KEY (\"template_id\", \"user_id\"))");
    await runner.query("CREATE INDEX \"IDX_template_likes_user_id\" ON \"template_likes\" (\"user_id\") ");
    await runner.query("CREATE TABLE \"template_reviews\" (\"id\" uuid NOT NULL, \"template_id\" uuid NOT NULL, \"user_id\" uuid NOT NULL, \"version_id\" uuid NOT NULL, \"rating\" smallint NOT NULL, \"body\" text, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL, \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT \"UQ_template_reviews_template_user\" UNIQUE (\"template_id\", \"user_id\"), CONSTRAINT \"CHK_template_reviews_body_length\" CHECK (\"body\" IS NULL OR char_length(\"body\") <= 2000), CONSTRAINT \"CHK_template_reviews_rating\" CHECK (\"rating\" >= 1 AND \"rating\" <= 5), CONSTRAINT \"PK_template_reviews\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_template_reviews_template_updated_at\" ON \"template_reviews\" (\"template_id\", \"updated_at\") ");
    await runner.query("ALTER TABLE \"template_likes\" ADD CONSTRAINT \"FK_template_likes_template\" FOREIGN KEY (\"template_id\") REFERENCES \"page_templates\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"template_likes\" ADD CONSTRAINT \"FK_template_likes_user\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"template_reviews\" ADD CONSTRAINT \"FK_template_reviews_template\" FOREIGN KEY (\"template_id\") REFERENCES \"page_templates\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"template_reviews\" ADD CONSTRAINT \"FK_template_reviews_user\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"template_reviews\" ADD CONSTRAINT \"FK_template_reviews_version\" FOREIGN KEY (\"version_id\") REFERENCES \"page_template_versions\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"template_reviews\" DROP CONSTRAINT \"FK_template_reviews_version\"");
    await runner.query("ALTER TABLE \"template_reviews\" DROP CONSTRAINT \"FK_template_reviews_user\"");
    await runner.query("ALTER TABLE \"template_reviews\" DROP CONSTRAINT \"FK_template_reviews_template\"");
    await runner.query("ALTER TABLE \"template_likes\" DROP CONSTRAINT \"FK_template_likes_user\"");
    await runner.query("ALTER TABLE \"template_likes\" DROP CONSTRAINT \"FK_template_likes_template\"");
    await runner.query("DROP INDEX \"public\".\"IDX_template_reviews_template_updated_at\"");
    await runner.query("DROP TABLE \"template_reviews\"");
    await runner.query("DROP INDEX \"public\".\"IDX_template_likes_user_id\"");
    await runner.query("DROP TABLE \"template_likes\"");
  }
}
