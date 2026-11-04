/**
 * Đánh giá với người dùng thật (quy trình AI, sau M4): thống kê Ask AI từ
 * ai_messages / ai_generations / ai_usage, và ai_ask_events khi bảng đã có
 * (kế hoạch ghi log Ask). Chỉ đọc (transaction READ ONLY),
 * mặc định không in nội dung câu hay trang — chỉ mã, loại, số đếm.
 *
 *   npx ts-node -r tsconfig-paths/register scripts/ai-usage-report.ts
 *     [--days=30 | --since=2026-10-01] [--until=2026-11-01]
 *     [--user=<uuid>] [--with-text]
 *
 * --with-text in thêm câu lệnh (≤ 120 ký tự) của các bản nháp cần xem lại và
 * của lượt không ra bản nháp (khi AI_ASK_LOG_TEXT=true), để bổ sung
 * intent_cases.jsonl. Chỉ dùng trên máy mình, không dán ra ngoài.
 */
import 'reflect-metadata';

import type { EntityManager } from 'typeorm';
import source from '../src/database/data-source';

const PLAN = 'GENERATE_PAGE_MODIFICATION_PLAN';

interface Options {
  since: Date;
  until: Date;
  userId: string | null;
  withText: boolean;
}

function parseOptions(argv: string[]): Options {
  const value = (name: string) =>
    argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
  const until = value('until') ? new Date(value('until')!) : new Date();
  const since = value('since')
    ? new Date(value('since')!)
    : new Date(until.getTime() - Number(value('days') ?? 30) * 86_400_000);
  const userId = value('user') ?? null;
  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    throw new Error('--since / --until phải là ngày hợp lệ, ví dụ 2026-10-01');
  }
  if (userId && !/^[0-9a-f-]{36}$/i.test(userId)) {
    throw new Error('--user phải là UUID');
  }
  return { since, until, userId, withText: argv.includes('--with-text') };
}

const pct = (part: number, total: number) =>
  total === 0 ? '—' : `${((100 * part) / total).toFixed(0)}%`;

function table(rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    console.log('  (không có dữ liệu)');
    return;
  }
  console.table(rows);
}

function heading(title: string): void {
  console.log(`\n== ${title} ==`);
}

async function report(manager: EntityManager, options: Options): Promise<void> {
  const params = [options.since, options.until, options.userId];
  // Same window and user filter for every query; $3 null = mọi người dùng.
  const generations = `
    SELECT g.* FROM ai_generations g
    WHERE g.created_at >= $1 AND g.created_at < $2
      AND ($3::uuid IS NULL OR g.user_id = $3)`;
  const userMessages = `
    SELECT m.* FROM ai_messages m
    JOIN ai_conversations c ON c.id = m.conversation_id
    WHERE m.role = 'USER' AND m.created_at >= $1 AND m.created_at < $2
      AND ($3::uuid IS NULL OR c.user_id = $3)`;
  const query = <T>(sql: string) => manager.query<T[]>(sql, params);

  heading('Phạm vi');
  console.log(
    `  ${options.since.toISOString()} → ${options.until.toISOString()}` +
      (options.userId ? `, người dùng ${options.userId}` : ', mọi người dùng'),
  );

  heading('Tổng quan');
  const [overview] = await query<Record<string, string>>(`
    SELECT
      (SELECT count(DISTINCT c.user_id) FROM (${userMessages}) m
         JOIN ai_conversations c ON c.id = m.conversation_id) AS "người dùng",
      (SELECT count(DISTINCT conversation_id) FROM (${userMessages}) m) AS "hội thoại",
      (SELECT count(*) FROM (${userMessages}) m) AS "lượt hỏi",
      (SELECT count(*) FROM (${generations}) g) AS "bản nháp / kết quả"`);
  table([overview]);

  heading('Lượt hỏi theo loại (tin nhắn người dùng)');
  // Ask lưu `capability` khi có bản nháp, `intent` cho WRITING / CREATE_PAGE.
  table(
    await query(`
      SELECT coalesce(m.metadata->>'capability', m.metadata->>'intent', '(không ghi)') AS "loại",
             count(*)::int AS "số lượt"
      FROM (${userMessages}) m GROUP BY 1 ORDER BY 2 DESC`),
  );

  heading('Bản nháp sửa trang');
  const planRows = await query<{
    status: string;
    plan_status: string;
    count: number;
  }>(`
    SELECT g.status, coalesce(g.output_data->>'status', '(lỗi)') AS plan_status, count(*)::int AS count
    FROM (${generations}) g WHERE g.capability = '${PLAN}' GROUP BY 1, 2`);
  const plans = planRows.reduce((sum, row) => sum + row.count, 0);
  const sum = (filter: (row: (typeof planRows)[number]) => boolean) =>
    planRows.filter(filter).reduce((total, row) => total + row.count, 0);
  const ready = sum((row) => row.plan_status === 'PLAN_READY');
  const applied = sum((row) => row.status === 'APPLIED');
  const discarded = sum((row) => row.status === 'DISCARDED');
  table([
    {
      tổng: plans,
      'sẵn sàng (PLAN_READY)': `${ready} (${pct(ready, plans)})`,
      'cần thêm thông tin': `${plans - ready} (${pct(plans - ready, plans)})`,
      'đã Apply / sẵn sàng': `${applied} (${pct(applied, ready)})`,
      'đã huỷ': discarded,
      'bỏ dở (chưa Apply, chưa huỷ)': ready - applied - discarded,
    },
  ]);

  console.log('\n  Lý do cần thêm thông tin:');
  table(
    await query(`
      SELECT coalesce(r->>'reason', '(không ghi)') AS "lý do", count(*)::int AS "số lần"
      FROM (${generations}) g, jsonb_array_elements(g.output_data->'contextRequests') r
      WHERE g.capability = '${PLAN}' GROUP BY 1 ORDER BY 2 DESC`),
  );

  console.log('\n  Theo cách sinh (luật = không gọi model):');
  table(
    await query(`
      SELECT CASE WHEN g.provider = 'rules' THEN 'luật' ELSE 'model' END AS "cách",
             coalesce(g.model, '?') AS "model",
             count(*)::int AS "bản nháp",
             count(*) FILTER (WHERE g.output_data->>'status' = 'PLAN_READY')::int AS "sẵn sàng",
             count(*) FILTER (WHERE g.status = 'APPLIED')::int AS "Apply",
             count(*) FILTER (WHERE g.status = 'DISCARDED')::int AS "huỷ"
      FROM (${generations}) g WHERE g.capability = '${PLAN}'
      GROUP BY 1, 2 ORDER BY 3 DESC`),
  );

  console.log('\n  Theo loại thao tác (một bản nháp có thể có nhiều loại):');
  table(
    await query(`
      SELECT t.type AS "thao tác", count(*)::int AS "bản nháp",
             count(*) FILTER (WHERE t.status = 'APPLIED')::int AS "Apply"
      FROM (
        SELECT DISTINCT g.id, g.status, op->>'type' AS type
        FROM (${generations}) g, jsonb_array_elements(g.output_data->'operations') op
        WHERE g.capability = '${PLAN}'
      ) t GROUP BY 1 ORDER BY 2 DESC`),
  );

  const [sourced] = await query<{ count: number }>(`
    SELECT count(*)::int AS count FROM (${generations}) g
    WHERE g.capability = '${PLAN}' AND jsonb_typeof(g.input_data->'sources') = 'array'`);
  console.log(
    `\n  Dựa trên trang khác (M8): ${sourced.count} / ${plans} bản nháp`,
  );

  heading('Tạo trang và viết');
  table(
    await query(`
      SELECT g.capability AS "chức năng", count(*)::int AS "kết quả",
             count(*) FILTER (WHERE g.status = 'APPLIED')::int AS "Apply",
             count(*) FILTER (WHERE g.status = 'DISCARDED')::int AS "huỷ",
             count(*) FILTER (WHERE g.status = 'FAILED')::int AS "lỗi"
      FROM (${generations}) g WHERE g.capability <> '${PLAN}'
      GROUP BY 1 ORDER BY 2 DESC`),
  );

  heading('Thời gian phản hồi (giây, từ câu hỏi đến câu trả lời)');
  table(
    await query(`
      SELECT g.capability AS "chức năng",
             CASE WHEN g.provider = 'rules' THEN 'luật' ELSE coalesce(g.model, '?') END AS "cách",
             count(*)::int AS "số lượt",
             round(percentile_cont(0.5) WITHIN GROUP (ORDER BY s)::numeric, 1) AS "p50",
             round(percentile_cont(0.95) WITHIN GROUP (ORDER BY s)::numeric, 1) AS "p95",
             round(max(s)::numeric, 1) AS "max"
      FROM (
        SELECT g.*, extract(epoch FROM a.created_at - u.created_at) AS s
        FROM (${generations}) g
        JOIN ai_messages a ON a.role = 'ASSISTANT' AND a.metadata->>'generationId' = g.id::text
        JOIN ai_messages u ON u.role = 'USER' AND u.conversation_id = a.conversation_id
          AND u.metadata->>'requestId' = a.metadata->>'requestId'
      ) g GROUP BY 1, 2 ORDER BY 1, 2`),
  );

  heading('Token theo model (ai_usage)');
  table(
    await query(`
      SELECT coalesce(u.model, '?') AS "model", count(*)::int AS "lượt gọi",
             sum(u.prompt_tokens)::int AS "prompt", sum(u.completion_tokens)::int AS "completion",
             round(avg(u.total_tokens))::int AS "TB / lượt"
      FROM ai_usage u
      WHERE u.created_at >= $1 AND u.created_at < $2 AND ($3::uuid IS NULL OR u.user_id = $3)
      GROUP BY 1 ORDER BY 2 DESC`),
  );

  heading('Bản nháp cần xem lại (cần thêm thông tin hoặc bị huỷ)');
  const review = await query<Record<string, unknown>>(`
    SELECT g.id AS "generation", to_char(g.created_at, 'YYYY-MM-DD HH24:MI') AS "lúc",
           CASE WHEN g.provider = 'rules' THEN 'luật' ELSE coalesce(g.model, '?') END AS "cách",
           CASE WHEN g.status = 'DISCARDED' THEN 'huỷ'
                ELSE coalesce(g.output_data->'contextRequests'->0->>'reason', g.output_data->>'status') END AS "vì sao"
           ${options.withText ? `, left(g.input_data->>'instruction', 120) AS "câu"` : ''}
    FROM (${generations}) g
    WHERE g.capability = '${PLAN}'
      AND (g.status = 'DISCARDED' OR g.output_data->>'status' <> 'PLAN_READY')
    ORDER BY g.created_at DESC LIMIT 30`);
  table(review);
  if (!options.withText && review.length > 0) {
    console.log('  Thêm --with-text để xem câu lệnh (chỉ trên máy mình).');
  }

  const [{ logged }] = await manager.query<{ logged: boolean }[]>(
    `SELECT to_regclass('public.ai_ask_events') IS NOT NULL AS logged`,
  );
  if (logged) {
    await askEventReport(query, options);
    return;
  }
  heading('Chưa đo được (chưa có bảng ai_ask_events — chạy migration)');
  for (const line of [
    'Lượt Ask không ra bản nháp: hỏi lại, chọn trang (AMBIGUOUS_PAGE), không tìm thấy trang, "chưa hỗ trợ", câu chỉ tìm trang.',
    'Cách tìm trang (EXACT_TITLE / ACTIVITY / FUZZY_TITLE / SEMANTIC / CONTENT) và trang người dùng chọn.',
    'Undo sau khi Apply.',
    'Ý định do bộ định tuyến phân loại khi không có bản nháp (OTHER / UNCLEAR).',
  ]) {
    console.log(`  - ${line}`);
  }
}

/** Kế hoạch ghi log Ask (L6): one row per Ask / Undo since the table exists. */
async function askEventReport(
  query: <T>(sql: string) => Promise<T[]>,
  options: Options,
): Promise<void> {
  const events = `
    SELECT e.* FROM ai_ask_events e
    WHERE e.created_at >= $1 AND e.created_at < $2
      AND ($3::uuid IS NULL OR e.user_id = $3)`;
  const asks = `SELECT * FROM (${events}) e WHERE e.kind = 'ASK'`;

  heading('Kết quả từng lượt Ask (ai_ask_events)');
  const [{ total }] = await query<{ total: number }>(
    `SELECT count(*)::int AS total FROM (${asks}) e`,
  );
  console.log(`  ${total} lượt Ask được ghi.`);
  table(
    await query(`
      SELECT e.status AS "kết quả", coalesce(e.reason, '') AS "lý do",
             count(*)::int AS "số lượt",
             round(100.0 * count(*) / nullif(sum(count(*)) OVER (), 0))::int AS "%"
      FROM (${asks}) e GROUP BY 1, 2 ORDER BY 3 DESC`),
  );

  heading('Cách tìm trang');
  table(
    await query(`
      SELECT coalesce(e.resolution_method, '(không có)') AS "cách",
             count(*) FILTER (WHERE e.status = 'AMBIGUOUS_PAGE')::int AS "phải chọn trang",
             round(avg(e.candidate_count) FILTER (WHERE e.status = 'AMBIGUOUS_PAGE'), 1) AS "TB ứng viên",
             count(*) FILTER (WHERE e.generation_id IS NOT NULL)::int AS "ra bản nháp",
             count(*) FILTER (WHERE e.generation_id IS NOT NULL AND e.flags ? 'selectedPage')::int AS "… sau khi chọn"
      FROM (${asks}) e WHERE e.intent = 'MODIFY_PAGE'
      GROUP BY 1 ORDER BY 2 DESC, 4 DESC`),
  );

  heading('Câu chỉ tìm trang (H5) và "dựa trên" (M8 / M8b)');
  table(
    await query(`
      SELECT
        count(*) FILTER (WHERE e.flags ? 'findOnly')::int AS "chỉ tìm trang",
        count(*) FILTER (WHERE e.flags ? 'basedOn')::int AS "có 'dựa trên'",
        count(*) FILTER (WHERE e.flags ? 'basedOn' AND e.reason = 'MISSING_SOURCE')::int AS "… không thấy nguồn",
        count(*) FILTER (WHERE e.flags ? 'basedOn' AND e.generation_id IS NOT NULL)::int AS "… ra bản nháp",
        count(*) FILTER (WHERE e.flags ? 'shareToken')::int AS "qua link chia sẻ"
      FROM (${asks}) e`),
  );

  heading('Thời gian theo kết quả (giây, cả lượt lỗi)');
  table(
    await query(`
      SELECT e.status AS "kết quả", coalesce(e.error_code, '') AS "mã lỗi",
             count(*)::int AS "số lượt",
             round((percentile_cont(0.5) WITHIN GROUP (ORDER BY e.duration_ms) / 1000)::numeric, 1) AS "p50",
             round((percentile_cont(0.95) WITHIN GROUP (ORDER BY e.duration_ms) / 1000)::numeric, 1) AS "p95"
      FROM (${asks}) e GROUP BY 1, 2 ORDER BY 3 DESC`),
  );

  heading('Undo');
  table(
    await query(`
      SELECT count(*)::int AS "số lần Undo",
             round(avg(extract(epoch FROM e.created_at - g.applied_at)) / 60, 1) AS "TB phút sau Apply"
      FROM (${events}) e LEFT JOIN ai_generations g ON g.id = e.generation_id
      WHERE e.kind = 'UNDO'`),
  );

  if (options.withText) {
    heading(
      'Câu không ra bản nháp (chỉ có khi bật AI_ASK_LOG_TEXT, giữ 30 ngày)',
    );
    table(
      await query(`
        SELECT to_char(e.created_at, 'YYYY-MM-DD HH24:MI') AS "lúc", e.status AS "kết quả",
               coalesce(e.reason, '') AS "lý do", left(e.instruction, 120) AS "câu"
        FROM (${asks}) e WHERE e.instruction IS NOT NULL
        ORDER BY e.created_at DESC LIMIT 50`),
    );
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  await source.initialize();
  const runner = source.createQueryRunner();
  await runner.connect();
  try {
    await runner.query('BEGIN TRANSACTION READ ONLY');
    await report(runner.manager, options);
  } finally {
    await runner.query('ROLLBACK');
    await runner.release();
    await source.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
