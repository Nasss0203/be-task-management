/**
 * Isolated, local Phase 3 API smoke test against real NestJS + FastAPI + Ollama.
 * Run from be-task-management. No secrets are printed or hard-coded.
 *
 * --preflight: read-only database schema check
 * --run: reuse an explicitly configured E2E fixture and access token.
 * Set E2E_WORKSPACE_ID, E2E_PAGE_ID, E2E_PAGE_TITLE,
 * E2E_DUPLICATE_TITLE and E2E_ACCESS_TOKEN in environment.
 * Does not register a user, verify email, create pages or execute a draft.
 *
 * PLAN_GENERATED persists a generation; run only against a disposable fixture.
 */
require('dotenv').config();
const { Client } = require('pg');

const base = process.env.E2E_NEST_URL || 'http://127.0.0.1:8081/api/v1';
const db = new Client({
  host: process.env.DB_HOST?.trim(),
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const fixtures = { userId: null, workspaceId: null, pageId: null, secondPageId: null };
let accessToken = null;
let passed = 0;
let failed = 0;

async function api(method, path, body, authenticated = true, timeout = 120000) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated && accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(timeout),
  });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = { message: text.slice(0, 240) }; }
  if (!response.ok) {
    const message = JSON.stringify({
      code: payload?.code ?? payload?.errorCode,
      message: payload?.message ?? payload?.detail,
    }).slice(0, 350);
    throw new Error(method + ' ' + path + ': HTTP ' + response.status + ' ' + message);
  }
  return payload?.data ?? payload;
}

async function schemaCheck() {
  const result = await db.query(
    'SELECT table_name, column_name FROM information_schema.columns ' +
    'WHERE table_schema=$1 AND table_name=ANY($2::text[]) ' +
    'AND column_name=ANY($3::text[]) ORDER BY table_name,column_name',
    ['public', ['users','workspaces','pages','page_blocks','ai_generations'],
      ['id','is_email_verified','deleted_at','page_id','workspace_id','status','title']]
  );
  console.log('SCHEMA', JSON.stringify(result.rows));
  const ws = await db.query('SELECT COUNT(*)::int AS count FROM public.workspaces');
  console.log('WORKSPACE_COUNT', ws.rows[0].count);
}

function verify(name, actual, expected) {
  const ok = actual === expected;
  if (ok) passed++; else failed++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ' expected=' + expected + ' actual=' + actual);
}

async function requestPlan(label, instruction, overrides = {}) {
  const body = {
    workspaceId: fixtures.workspaceId,
    instruction,
    ...overrides,
  };
  const result = await api('POST', '/ai-assistant/pages/modification-plan/from-instruction', body, true, 240000);
  console.log('CASE', label, 'status=' + result.status,
    'reason=' + (result.reason ?? '-'),
    'intent=' + (result.intent?.intent ?? '-'),
    'reference=' + (result.intent?.pageReference ?? '-'));
  return result;
}

async function countBlocks() {
  const r = await db.query('SELECT COUNT(*)::int AS count FROM page_blocks WHERE page_id=$1 AND deleted_at IS NULL', [fixtures.pageId]);
  return r.rows[0].count;
}

async function negativeRequest(name, body, token, acceptedStatuses, expectedSafeStatus) {
  const response = await fetch(base + '/ai-assistant/pages/modification-plan/from-instruction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ workspaceId: fixtures.workspaceId, ...body }),
    signal: AbortSignal.timeout(60000),
  });
  let parsed = {};
  try { parsed = await response.json(); } catch {}
  const result = parsed?.data ?? parsed;
  const safe = acceptedStatuses.includes(response.status) ||
    (response.ok && expectedSafeStatus && result?.status === expectedSafeStatus);
  verify(name + ' denied without preview', safe, true);
  console.log('NEGATIVE_CASE', name, 'HTTP', response.status, 'status', result?.status ?? '-');
}

async function main() {
  await db.connect();
  try {
    await schemaCheck();
    if (process.argv.includes('--preflight')) return;
    if (!process.argv.includes('--run')) {
      console.log('SAFE_DEFAULT: preflight only. Pass --run with existing test fixture env to execute.');
      return;
    }
    const required = ['E2E_WORKSPACE_ID','E2E_PAGE_ID','E2E_PAGE_TITLE','E2E_DUPLICATE_TITLE','E2E_ACCESS_TOKEN'];
    const absent = required.filter(key => !process.env[key]);
    if (absent.length) throw new Error('Missing E2E configuration: '+absent.join(','));
    fixtures.workspaceId = process.env.E2E_WORKSPACE_ID;
    fixtures.pageId = process.env.E2E_PAGE_ID;
    accessToken = process.env.E2E_ACCESS_TOKEN;
    const pageTitle = process.env.E2E_PAGE_TITLE;
    const duplicates = process.env.E2E_DUPLICATE_TITLE;
    if (!pageTitle.startsWith('Phase3 E2E ') || !duplicates.startsWith('Phase3 E2E ')) {
      throw new Error('Only explicitly labelled Phase3 E2E fixtures are allowed');
    }
    const existing = await db.query('SELECT id,title FROM pages WHERE id=$1 AND workspace_id=$2 AND title=$3 AND deleted_at IS NULL',[fixtures.pageId,fixtures.workspaceId,pageTitle]);
    if (existing.rowCount !== 1) throw new Error('Fixture Page does not match expected workspace/title');
    const duplicateRows = await db.query('SELECT id FROM pages WHERE workspace_id=$1 AND title=$2 AND deleted_at IS NULL',[fixtures.workspaceId,duplicates]);
    if (duplicateRows.rowCount !== 2) throw new Error('Fixture requires exactly two accessible duplicate-title Pages');

    const startGenerations = await db.query('SELECT COUNT(*)::int AS n FROM ai_generations WHERE workspace_id=$1',[fixtures.workspaceId]);
    await negativeRequest('INVALID_TOKEN', { instruction: 'Thêm checklist QA vào page ' + pageTitle }, 'invalid.test.token', [401,403]);
    if (process.env.E2E_EXPIRED_ACCESS_TOKEN) {
      await negativeRequest('EXPIRED_TOKEN', { instruction: 'Thêm checklist QA vào page ' + pageTitle }, process.env.E2E_EXPIRED_ACCESS_TOKEN, [401,403]);
    }
    if (process.env.E2E_OTHER_USER_TOKEN) {
      await negativeRequest('NO_WORKSPACE_ACCESS', { instruction: 'Thêm checklist QA vào page ' + pageTitle }, process.env.E2E_OTHER_USER_TOKEN, [401,403,404], 'PAGE_NOT_FOUND');
    }
    if (process.env.E2E_FOREIGN_PAGE_ID) {
      await negativeRequest('CROSS_WORKSPACE_CURRENT_PAGE', { instruction: 'Thêm checklist QA vào page này', currentPageId: process.env.E2E_FOREIGN_PAGE_ID }, accessToken, [403,404], 'PAGE_NOT_FOUND');
    }
    const afterNegative = await db.query('SELECT COUNT(*)::int AS n FROM ai_generations WHERE workspace_id=$1',[fixtures.workspaceId]);
    verify('negative cases create no AI Generations', afterNegative.rows[0].n, startGenerations.rows[0].n);

    const baselineBlocks = await countBlocks();
    console.log('PAGE_BLOCKS_BEFORE', baselineBlocks);

    const other = await requestPlan('OTHER', 'Tạo page ' + pageTitle);
    verify('create page is OTHER', other.status, 'NOT_A_PAGE_MODIFICATION');

    const currentMissing = await requestPlan('CURRENT_MISSING', 'Thêm checklist QA vào page này');
    verify('current page without context requires clarification', currentMissing.status, 'NEEDS_CLARIFICATION');
    verify('missing current context reason', currentMissing.reason, 'MISSING_CURRENT_PAGE');

    const unresolved = await requestPlan('UNRESOLVED', 'Thêm checklist QA vào page tôi sửa hôm qua');
    verify('activity-based target unresolved', unresolved.status, 'NEEDS_CLARIFICATION');

    const notFound = await requestPlan('NOT_FOUND', 'Thêm checklist QA vào page MissingPhase3PageE2E999999');
    verify('unknown page not found', notFound.status, 'PAGE_NOT_FOUND');

    try {
      const ambiguous = await requestPlan('AMBIGUOUS', 'Thêm checklist QA vào page ' + duplicates);
      verify('duplicate title ambiguous', ambiguous.status, 'AMBIGUOUS_PAGE');
      if (ambiguous.status === 'AMBIGUOUS_PAGE') {
        verify('two accessible candidates', ambiguous.candidates?.length, 2);
        const selected = ambiguous.candidates[1];
        const chosen = await requestPlan('SELECTED_PAGE', 'Thêm một heading QA vào page ' + duplicates, { selectedPageId: selected.pageId });
        verify('selected Page generates preview', chosen.status, 'PLAN_GENERATED');
        if (chosen.status === 'PLAN_GENERATED') {
          verify('chosen preview targets selected page', chosen.plan?.pageId, selected.pageId);
        }
        const invalid = await requestPlan('INVALID_SELECTION', 'Thêm checklist QA vào page ' + duplicates, { selectedPageId: fixtures.pageId });
        verify('unmatched selected page rejected', invalid.status, 'PAGE_NOT_FOUND');
      }
    } catch (error) {
      failed++;
      console.log('FAIL AMBIGUOUS', error.message);
    }

    try {
      const success = await requestPlan('NAMED_TITLE', 'Thêm một heading Sprint Goal vào page ' + pageTitle);
      const validStatus = ['PLAN_GENERATED','PLAN_NEEDS_MORE_CONTEXT'].includes(success.status);
      verify('planner returns a persisted preview or asks for context', validStatus, true);
      if (validStatus) {
        verify('resolved pageId matches test page', success.page?.pageId, fixtures.pageId);
        verify('plan references authorized pageId', success.plan?.pageId, fixtures.pageId);
        verify('outer status matches plan readiness', success.status,
          success.plan?.status === 'PLAN_READY' ? 'PLAN_GENERATED' : 'PLAN_NEEDS_MORE_CONTEXT');
        console.log('PREVIEW', JSON.stringify({
          planStatus: success.plan?.status,
          generationId: success.plan?.generationId,
          conversationId: success.plan?.conversationId,
          summary: success.plan?.summary,
          operationTypes: success.plan?.operations?.map(x => x.type),
        }));
        const check = await db.query('SELECT id, status FROM ai_generations WHERE id=$1', [success.plan.generationId]);
        verify('generation persisted in PostgreSQL', check.rowCount, 1);
      }
    } catch (error) {
      failed++;
      console.log('FAIL NAMED_TITLE', error.message);
    }
    verify('page blocks unchanged after draft', await countBlocks(), baselineBlocks);
  } finally {
    console.log('FIXTURE_IDS', JSON.stringify(fixtures));
    console.log('E2E_SUMMARY', passed + ' passed, ' + failed + ' failed');
    await db.end();
  }
  if (failed) process.exitCode = 1;
}

main().catch(async error => {
  console.error('E2E_ABORTED', error.message.slice(0, 500));
  console.log('FIXTURE_IDS', JSON.stringify(fixtures));
  try { await db.end(); } catch {}
  process.exitCode = 1;
});
