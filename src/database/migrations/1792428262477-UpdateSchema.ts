import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1792428262477 implements MigrationInterface {
  name = 'UpdateSchema1792428262477';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TYPE \"public\".\"page_blocks_type_enum\" RENAME TO \"page_blocks_type_enum_old\"");
    await runner.query("CREATE TYPE \"public\".\"page_blocks_type_enum\" AS ENUM('TEXT', 'HEADER', 'QUOTE', 'DIVIDER', 'CODE', 'TODO', 'BULLETED_LIST', 'NUMBERED_LIST', 'CALLOUT', 'IMAGE', 'VIDEO', 'FILE', 'BOOKMARK', 'EMBED', 'FIGMA', 'GITHUB_GIST', 'GOOGLE_MAPS', 'TWEET', 'DATABASE_VIEW', 'TABLE_SIMPLE', 'MERMAID', 'BUTTON', 'TOGGLE')");
    await runner.query("ALTER TABLE \"page_blocks\" ALTER COLUMN \"type\" TYPE \"public\".\"page_blocks_type_enum\" USING \"type\"::\"text\"::\"public\".\"page_blocks_type_enum\"");
    await runner.query("DROP TYPE \"public\".\"page_blocks_type_enum_old\"");
    await runner.query("ALTER TYPE \"public\".\"page_template_blocks_type_enum\" RENAME TO \"page_template_blocks_type_enum_old\"");
    await runner.query("CREATE TYPE \"public\".\"page_template_blocks_type_enum\" AS ENUM('TEXT', 'HEADER', 'QUOTE', 'DIVIDER', 'CODE', 'TODO', 'BULLETED_LIST', 'NUMBERED_LIST', 'CALLOUT', 'IMAGE', 'VIDEO', 'FILE', 'BOOKMARK', 'EMBED', 'FIGMA', 'GITHUB_GIST', 'GOOGLE_MAPS', 'TWEET', 'DATABASE_VIEW', 'TABLE_SIMPLE', 'MERMAID', 'BUTTON', 'TOGGLE')");
    await runner.query("ALTER TABLE \"page_template_blocks\" ALTER COLUMN \"type\" TYPE \"public\".\"page_template_blocks_type_enum\" USING \"type\"::\"text\"::\"public\".\"page_template_blocks_type_enum\"");
    await runner.query("DROP TYPE \"public\".\"page_template_blocks_type_enum_old\"");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TYPE \"public\".\"page_template_blocks_type_enum_old\" AS ENUM('BOOKMARK', 'BUTTON', 'CODE', 'DATABASE_VIEW', 'DIVIDER', 'EMBED', 'FIGMA', 'FILE', 'GITHUB_GIST', 'GOOGLE_MAPS', 'HEADER', 'IMAGE', 'MERMAID', 'QUOTE', 'TABLE_SIMPLE', 'TEXT', 'TODO', 'TOGGLE', 'TWEET', 'VIDEO')");
    await runner.query("ALTER TABLE \"page_template_blocks\" ALTER COLUMN \"type\" TYPE \"public\".\"page_template_blocks_type_enum_old\" USING \"type\"::\"text\"::\"public\".\"page_template_blocks_type_enum_old\"");
    await runner.query("DROP TYPE \"public\".\"page_template_blocks_type_enum\"");
    await runner.query("ALTER TYPE \"public\".\"page_template_blocks_type_enum_old\" RENAME TO \"page_template_blocks_type_enum\"");
    await runner.query("CREATE TYPE \"public\".\"page_blocks_type_enum_old\" AS ENUM('BOOKMARK', 'BUTTON', 'CODE', 'DATABASE_VIEW', 'DIVIDER', 'EMBED', 'FIGMA', 'FILE', 'GITHUB_GIST', 'GOOGLE_MAPS', 'HEADER', 'IMAGE', 'MERMAID', 'QUOTE', 'TABLE_SIMPLE', 'TEXT', 'TODO', 'TOGGLE', 'TWEET', 'VIDEO')");
    await runner.query("ALTER TABLE \"page_blocks\" ALTER COLUMN \"type\" TYPE \"public\".\"page_blocks_type_enum_old\" USING \"type\"::\"text\"::\"public\".\"page_blocks_type_enum_old\"");
    await runner.query("DROP TYPE \"public\".\"page_blocks_type_enum\"");
    await runner.query("ALTER TYPE \"public\".\"page_blocks_type_enum_old\" RENAME TO \"page_blocks_type_enum\"");
  }
}
