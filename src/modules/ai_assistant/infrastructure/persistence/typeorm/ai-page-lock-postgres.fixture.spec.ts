import { AiPageLockPostgresFixture } from './ai-page-lock-postgres.fixture';

describe('AI PostgreSQL fixture safety', () => {
  const original = process.env.AI_PAGE_LOCK_TEST_DATABASE_URL;
  afterEach(() => {
    if (original === undefined)
      delete process.env.AI_PAGE_LOCK_TEST_DATABASE_URL;
    else process.env.AI_PAGE_LOCK_TEST_DATABASE_URL = original;
  });

  it('never falls back to application database configuration', async () => {
    delete process.env.AI_PAGE_LOCK_TEST_DATABASE_URL;
    await expect(new AiPageLockPostgresFixture().initialize()).rejects.toThrow(
      'application DB is forbidden',
    );
  });

  it.each([
    'postgresql://postgres@127.0.0.1/taskmanly',
    'postgresql://postgres@database.example/taskmanly_ai_lock_test',
  ])('refuses non-disposable database or remote host', async (url) => {
    process.env.AI_PAGE_LOCK_TEST_DATABASE_URL = url;
    await expect(new AiPageLockPostgresFixture().initialize()).rejects.toThrow(
      'require a local taskmanly_ai_lock_test database',
    );
  });
});
