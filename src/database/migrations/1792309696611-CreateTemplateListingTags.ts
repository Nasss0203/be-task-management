import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateListingTags1792309696611 implements MigrationInterface {
  name = 'CreateTemplateListingTags1792309696611';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"template_listing_tags\" (\"listing_id\" uuid NOT NULL, \"tag\" character varying(32) NOT NULL, CONSTRAINT \"CHK_template_listing_tags_tag\" CHECK (\"tag\" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(\"tag\") BETWEEN 2 AND 32), CONSTRAINT \"PK_de35ba260759df9408a9316f0b4\" PRIMARY KEY (\"listing_id\", \"tag\"))");
    await runner.query("CREATE INDEX \"IDX_template_listing_tags_tag\" ON \"template_listing_tags\" (\"tag\") ");
    await runner.query("ALTER TABLE \"template_listing_tags\" ADD CONSTRAINT \"FK_template_listing_tags_listing\" FOREIGN KEY (\"listing_id\") REFERENCES \"template_listings\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"template_listing_tags\" DROP CONSTRAINT \"FK_template_listing_tags_listing\"");
    await runner.query("DROP INDEX \"public\".\"IDX_template_listing_tags_tag\"");
    await runner.query("DROP TABLE \"template_listing_tags\"");
  }
}
