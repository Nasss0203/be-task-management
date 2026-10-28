import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateComments1793165145122 implements MigrationInterface {
  name = 'CreateComments1793165145122';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"IDX_08cc326bcc36b69774c6721e9a\"");
    await runner.query("DROP INDEX \"public\".\"IDX_47d7917a734629d1cc15887086\"");
    await runner.query("DROP INDEX \"public\".\"IDX_fa0f2f3576ba3faf0607be6445\"");
    await runner.query("DROP INDEX \"public\".\"IDX_d644737df1052524a913770615\"");
    await runner.query("CREATE TYPE \"public\".\"comments_target_type_enum\" AS ENUM('PAGE', 'PAGE_BLOCK', 'DATABASE_ROW')");
    await runner.query("CREATE TABLE \"comments\" (\"id\" uuid NOT NULL, \"workspace_id\" uuid NOT NULL, \"page_id\" uuid NOT NULL, \"target_type\" \"public\".\"comments_target_type_enum\" NOT NULL, \"target_id\" uuid NOT NULL, \"parent_comment_id\" uuid, \"author_id\" uuid NOT NULL, \"body\" text NOT NULL, \"resolved_at\" TIMESTAMP WITH TIME ZONE, \"resolved_by\" uuid, \"edited_at\" TIMESTAMP WITH TIME ZONE, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"deleted_at\" TIMESTAMP WITH TIME ZONE, CONSTRAINT \"PK_8bf68bc960f2b69e818bdb90dcb\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_comments_parent_comment_id\" ON \"comments\" (\"parent_comment_id\") ");
    await runner.query("CREATE INDEX \"IDX_comments_page_id\" ON \"comments\" (\"page_id\") ");
    await runner.query("CREATE INDEX \"IDX_comments_target\" ON \"comments\" (\"target_type\", \"target_id\", \"created_at\") ");
    await runner.query("ALTER TABLE \"mentions\" DROP COLUMN \"project_id\"");
    await runner.query("ALTER TYPE \"public\".\"mentions_source_type_enum\" RENAME TO \"mentions_source_type_enum_old\"");
    await runner.query("CREATE TYPE \"public\".\"mentions_source_type_enum\" AS ENUM('PAGE_BLOCK', 'COMMENT')");
    await runner.query("ALTER TABLE \"mentions\" ALTER COLUMN \"source_type\" TYPE \"public\".\"mentions_source_type_enum\" USING \"source_type\"::\"text\"::\"public\".\"mentions_source_type_enum\"");
    await runner.query("DROP TYPE \"public\".\"mentions_source_type_enum_old\"");
    await runner.query("ALTER TYPE \"public\".\"mentions_entity_type_enum\" RENAME TO \"mentions_entity_type_enum_old\"");
    await runner.query("CREATE TYPE \"public\".\"mentions_entity_type_enum\" AS ENUM('PAGE', 'PAGE_BLOCK', 'DATABASE_ROW')");
    await runner.query("ALTER TABLE \"mentions\" ALTER COLUMN \"entity_type\" TYPE \"public\".\"mentions_entity_type_enum\" USING \"entity_type\"::\"text\"::\"public\".\"mentions_entity_type_enum\"");
    await runner.query("DROP TYPE \"public\".\"mentions_entity_type_enum_old\"");
    await runner.query("ALTER TABLE \"mentions\" DROP COLUMN \"created_at\"");
    await runner.query("ALTER TABLE \"mentions\" ADD \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()");
    await runner.query("CREATE INDEX \"IDX_mentions_notification_id\" ON \"mentions\" (\"notification_id\") ");
    await runner.query("CREATE INDEX \"IDX_mentions_entity\" ON \"mentions\" (\"entity_type\", \"entity_id\") ");
    await runner.query("CREATE INDEX \"IDX_mentions_workspace_mentioned_user\" ON \"mentions\" (\"workspace_id\", \"mentioned_user_id\") ");
    await runner.query("ALTER TABLE \"mentions\" ADD CONSTRAINT \"UQ_mentions_source_user\" UNIQUE (\"source_type\", \"source_id\", \"mentioned_user_id\")");
    await runner.query("ALTER TABLE \"comments\" ADD CONSTRAINT \"FK_comments_workspace_id\" FOREIGN KEY (\"workspace_id\") REFERENCES \"workspaces\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"comments\" ADD CONSTRAINT \"FK_comments_page_id\" FOREIGN KEY (\"page_id\") REFERENCES \"pages\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"comments\" ADD CONSTRAINT \"FK_comments_parent_comment_id\" FOREIGN KEY (\"parent_comment_id\") REFERENCES \"comments\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"comments\" ADD CONSTRAINT \"FK_comments_author_id\" FOREIGN KEY (\"author_id\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"comments\" ADD CONSTRAINT \"FK_comments_resolved_by\" FOREIGN KEY (\"resolved_by\") REFERENCES \"users\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"mentions\" ADD CONSTRAINT \"FK_mentions_workspace_id\" FOREIGN KEY (\"workspace_id\") REFERENCES \"workspaces\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"mentions\" ADD CONSTRAINT \"FK_mentions_mentioner_id\" FOREIGN KEY (\"mentioner_id\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"mentions\" ADD CONSTRAINT \"FK_mentions_mentioned_user_id\" FOREIGN KEY (\"mentioned_user_id\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
    await runner.query("ALTER TABLE \"mentions\" ADD CONSTRAINT \"FK_mentions_notification_id\" FOREIGN KEY (\"notification_id\") REFERENCES \"notifications\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"mentions\" DROP CONSTRAINT \"FK_mentions_notification_id\"");
    await runner.query("ALTER TABLE \"mentions\" DROP CONSTRAINT \"FK_mentions_mentioned_user_id\"");
    await runner.query("ALTER TABLE \"mentions\" DROP CONSTRAINT \"FK_mentions_mentioner_id\"");
    await runner.query("ALTER TABLE \"mentions\" DROP CONSTRAINT \"FK_mentions_workspace_id\"");
    await runner.query("ALTER TABLE \"comments\" DROP CONSTRAINT \"FK_comments_resolved_by\"");
    await runner.query("ALTER TABLE \"comments\" DROP CONSTRAINT \"FK_comments_author_id\"");
    await runner.query("ALTER TABLE \"comments\" DROP CONSTRAINT \"FK_comments_parent_comment_id\"");
    await runner.query("ALTER TABLE \"comments\" DROP CONSTRAINT \"FK_comments_page_id\"");
    await runner.query("ALTER TABLE \"comments\" DROP CONSTRAINT \"FK_comments_workspace_id\"");
    await runner.query("ALTER TABLE \"mentions\" DROP CONSTRAINT \"UQ_mentions_source_user\"");
    await runner.query("DROP INDEX \"public\".\"IDX_mentions_workspace_mentioned_user\"");
    await runner.query("DROP INDEX \"public\".\"IDX_mentions_entity\"");
    await runner.query("DROP INDEX \"public\".\"IDX_mentions_notification_id\"");
    await runner.query("ALTER TABLE \"mentions\" DROP COLUMN \"created_at\"");
    await runner.query("ALTER TABLE \"mentions\" ADD \"created_at\" TIMESTAMP NOT NULL DEFAULT now()");
    await runner.query("CREATE TYPE \"public\".\"mentions_entity_type_enum_old\" AS ENUM('TASK', 'PAGE', 'PAGE_BLOCK')");
    await runner.query("ALTER TABLE \"mentions\" ALTER COLUMN \"entity_type\" TYPE \"public\".\"mentions_entity_type_enum_old\" USING \"entity_type\"::\"text\"::\"public\".\"mentions_entity_type_enum_old\"");
    await runner.query("DROP TYPE \"public\".\"mentions_entity_type_enum\"");
    await runner.query("ALTER TYPE \"public\".\"mentions_entity_type_enum_old\" RENAME TO \"mentions_entity_type_enum\"");
    await runner.query("CREATE TYPE \"public\".\"mentions_source_type_enum_old\" AS ENUM('TASK_COMMENT', 'PAGE_COMMENT', 'PAGE_BLOCK')");
    await runner.query("ALTER TABLE \"mentions\" ALTER COLUMN \"source_type\" TYPE \"public\".\"mentions_source_type_enum_old\" USING \"source_type\"::\"text\"::\"public\".\"mentions_source_type_enum_old\"");
    await runner.query("DROP TYPE \"public\".\"mentions_source_type_enum\"");
    await runner.query("ALTER TYPE \"public\".\"mentions_source_type_enum_old\" RENAME TO \"mentions_source_type_enum\"");
    await runner.query("ALTER TABLE \"mentions\" ADD \"project_id\" uuid");
    await runner.query("DROP INDEX \"public\".\"IDX_comments_target\"");
    await runner.query("DROP INDEX \"public\".\"IDX_comments_page_id\"");
    await runner.query("DROP INDEX \"public\".\"IDX_comments_parent_comment_id\"");
    await runner.query("DROP TABLE \"comments\"");
    await runner.query("DROP TYPE \"public\".\"comments_target_type_enum\"");
    await runner.query("CREATE INDEX \"IDX_d644737df1052524a913770615\" ON \"mentions\" (\"entity_id\", \"entity_type\") ");
    await runner.query("CREATE INDEX \"IDX_fa0f2f3576ba3faf0607be6445\" ON \"mentions\" (\"source_id\", \"source_type\", \"workspace_id\") ");
    await runner.query("CREATE INDEX \"IDX_47d7917a734629d1cc15887086\" ON \"mentions\" (\"mentioned_user_id\", \"workspace_id\") ");
    await runner.query("CREATE INDEX \"IDX_08cc326bcc36b69774c6721e9a\" ON \"mentions\" (\"notification_id\") ");
  }
}
