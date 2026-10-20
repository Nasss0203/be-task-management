import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiConversationScope1792300000000 implements MigrationInterface {
  name = 'AddAiConversationScope1792300000000';
  transaction = true;

  async up(runner: QueryRunner): Promise<void> {
    if (!runner.isTransactionActive) {
      throw new Error('AI conversation scope migration requires a transaction');
    }
    // Hold existing rows stable while validating and replacing constraints.
    await runner.query(`LOCK TABLE public.pages, public.ai_conversations,
      public.ai_messages, public.ai_generations, public.ai_tool_calls,
      public.ai_usage IN SHARE ROW EXCLUSIVE MODE`);
    const relations = [
      [
        'ai_messages',
        'conversation_id',
        'ai_conversations',
        'FK_de21fcb2d1df7fd6ca70f555b6d',
        'c',
      ],
      [
        'ai_generations',
        'conversation_id',
        'ai_conversations',
        'FK_a2199c6831df88c3e9c978ea4b5',
        'n',
      ],
      [
        'ai_tool_calls',
        'generation_id',
        'ai_generations',
        'FK_73b4726214c8da50c03f959bdcc',
        'c',
      ],
      [
        'ai_usage',
        'conversation_id',
        'ai_conversations',
        'FK_fb51cf283ac9e86792e4c0008a3',
        'n',
      ],
      [
        'ai_usage',
        'generation_id',
        'ai_generations',
        'FK_8d35990de31cf2fb45be6002a34',
        'n',
      ],
    ];
    for (const [table, column, parent, constraint, action] of relations) {
      const invalid: { found: boolean }[] = await runner.query(
        `SELECT EXISTS (SELECT 1 FROM public."${table}" child
          LEFT JOIN public."${parent}" parent ON parent.id = child."${column}"
          WHERE child."${column}" IS NOT NULL AND parent.id IS NULL) AS found`,
      );
      if (invalid[0].found)
        throw new Error(`Orphan rows in ${table}.${column}`);
      const existing: { valid: boolean }[] = await runner.query(
        `SELECT convalidated AND confdeltype = $5 AND confupdtype = 'a'
          AND confrelid = $3::regclass
          AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = $1::regclass AND attname = $4)]
          AND confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = $3::regclass AND attname = 'id')]
          AS valid FROM pg_constraint
          WHERE conrelid = $1::regclass AND conname = $2 AND contype = 'f'`,
        [`public.${table}`, constraint, `public.${parent}`, column, action],
      );
      if (existing.length !== 1 || !existing[0].valid) {
        throw new Error(`Unexpected foreign key: ${table}.${constraint}`);
      }
    }
    await runner.query(
      `CREATE TYPE public.ai_conversations_scope_enum AS ENUM ('GLOBAL', 'PAGE', 'LEGACY')`,
    );
    await runner.query(`ALTER TABLE public.ai_conversations
      ADD COLUMN scope public.ai_conversations_scope_enum NOT NULL DEFAULT 'LEGACY',
      ADD COLUMN page_id uuid,
      ADD CONSTRAINT "CHK_ai_conversations_scope_page" CHECK (
        (scope = 'PAGE' AND page_id IS NOT NULL) OR
        (scope IN ('GLOBAL', 'LEGACY') AND page_id IS NULL)),
      ADD CONSTRAINT "FK_ai_conversations_page_id" FOREIGN KEY (page_id)
        REFERENCES public.pages(id) ON DELETE CASCADE ON UPDATE NO ACTION`);
    for (const [table, column, parent, constraint, action] of relations) {
      if (action === 'c') continue;
      await runner.query(`ALTER TABLE public."${table}"
        DROP CONSTRAINT "${constraint}",
        ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}")
        REFERENCES public."${parent}"(id) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    await runner.query(
      `CREATE INDEX "IDX_ai_conversations_page_id" ON public.ai_conversations (page_id)`,
    );
    await runner.query(`CREATE INDEX "IDX_ai_conversations_user_workspace_scope_page_created"
      ON public.ai_conversations (user_id, workspace_id, scope, page_id, created_at, id)`);
  }

  async down(): Promise<void> {
    // Removing scope/page_id would destroy conversation ownership information.
    throw new Error(
      'Data-preserving rollback requires a separately reviewed forward migration',
    );
  }
}
