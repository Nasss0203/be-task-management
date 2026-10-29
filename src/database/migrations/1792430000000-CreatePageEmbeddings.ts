import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePageEmbeddings1792430000000 implements MigrationInterface {
  name = 'CreatePageEmbeddings1792430000000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"page_embeddings\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"workspace_id\" uuid NOT NULL, \"page_id\" uuid NOT NULL, \"block_id\" uuid, \"resource_type\" character varying(16) NOT NULL, \"chunk_index\" integer NOT NULL DEFAULT '0', \"content_hash\" character(64) NOT NULL, \"model\" character varying(100) NOT NULL, \"dimensions\" integer NOT NULL, \"embedding\" real array NOT NULL, \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_page_embeddings\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_page_embeddings_page_id\" ON \"page_embeddings\" (\"page_id\") ");
    await runner.query("CREATE INDEX \"IDX_page_embeddings_workspace_model\" ON \"page_embeddings\" (\"workspace_id\", \"model\") ");
    await runner.query("CREATE TABLE \"page_index_state\" (\"page_id\" uuid NOT NULL, \"indexed_at\" TIMESTAMP NOT NULL, \"model\" character varying(100) NOT NULL, CONSTRAINT \"REL_page_index_state_page\" UNIQUE (\"page_id\"), CONSTRAINT \"PK_page_index_state\" PRIMARY KEY (\"page_id\"))");
    await runner.query("ALTER TABLE \"page_embeddings\" ADD CONSTRAINT \"FK_page_embeddings_page\" FOREIGN KEY (\"page_id\") REFERENCES \"pages\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"page_embeddings\" ADD CONSTRAINT \"FK_page_embeddings_block\" FOREIGN KEY (\"block_id\") REFERENCES \"page_blocks\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"page_index_state\" ADD CONSTRAINT \"FK_page_index_state_page\" FOREIGN KEY (\"page_id\") REFERENCES \"pages\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"page_index_state\" DROP CONSTRAINT \"FK_page_index_state_page\"");
    await runner.query("ALTER TABLE \"page_embeddings\" DROP CONSTRAINT \"FK_page_embeddings_block\"");
    await runner.query("ALTER TABLE \"page_embeddings\" DROP CONSTRAINT \"FK_page_embeddings_page\"");
    await runner.query("DROP TABLE \"page_index_state\"");
    await runner.query("DROP INDEX \"public\".\"IDX_page_embeddings_workspace_model\"");
    await runner.query("DROP INDEX \"public\".\"IDX_page_embeddings_page_id\"");
    await runner.query("DROP TABLE \"page_embeddings\"");
  }
}
