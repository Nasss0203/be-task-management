import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateMarketplaceReleases1792100000001 implements MigrationInterface {
  name = 'CreateTemplateMarketplaceReleases1792100000001';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"template_marketplace_releases\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"template_id\" uuid NOT NULL, \"version_id\" uuid NOT NULL, \"released_at\" TIMESTAMP WITH TIME ZONE NOT NULL, \"released_by\" uuid, \"offer_type_at_release\" character varying NOT NULL, CONSTRAINT \"UQ_template_marketplace_releases_template_version\" UNIQUE (\"template_id\", \"version_id\"), CONSTRAINT \"CHK_template_marketplace_releases_offer_type\" CHECK (\"offer_type_at_release\" IN ('FREE', 'PAID')), CONSTRAINT \"PK_template_marketplace_releases\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_template_marketplace_releases_template_released_at\" ON \"template_marketplace_releases\" (\"template_id\", \"released_at\") ");
    await runner.query("ALTER TABLE \"template_marketplace_releases\" ADD CONSTRAINT \"FK_template_marketplace_releases_template\" FOREIGN KEY (\"template_id\") REFERENCES \"page_templates\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"template_marketplace_releases\" ADD CONSTRAINT \"FK_template_marketplace_releases_version_template\" FOREIGN KEY (\"version_id\", \"template_id\") REFERENCES \"page_template_versions\"(\"id\",\"template_id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"template_marketplace_releases\" DROP CONSTRAINT \"FK_template_marketplace_releases_version_template\"");
    await runner.query("ALTER TABLE \"template_marketplace_releases\" DROP CONSTRAINT \"FK_template_marketplace_releases_template\"");
    await runner.query("DROP INDEX \"public\".\"IDX_template_marketplace_releases_template_released_at\"");
    await runner.query("DROP TABLE \"template_marketplace_releases\"");
  }
}
