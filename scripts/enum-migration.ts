import { basename } from 'node:path';
import ts from 'typescript';
import { DataSource } from 'typeorm';
import {
  assertEnumChange,
  EnumChange,
  enumAddedValues,
  enumDown,
  enumRestore,
  enumTable,
  enumUp,
  sqlTokens,
} from '../src/database/enum-additive-policy';

export async function enumCatalog(db: DataSource, enumName: string) {
  return db.query(
    `SELECT e.enumlabel AS label,e.enumsortorder::text AS position,e.oid::text AS oid
    FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' AND t.typname=$1 ORDER BY e.enumsortorder`,
    [enumName],
  ) as Promise<{ label: string; position: string; oid: string }[]>;
}

export async function detectEnumChange(
  db: DataSource,
): Promise<EnumChange | undefined> {
  const candidates: {
    change: EnumChange;
    column: (typeof db.entityMetadatas)[number]['columns'][number];
  }[] = [];
  for (const entity of db.entityMetadatas) {
    for (const column of entity.columns.filter(
      (item) => item.type === 'enum' || item.type === 'simple-enum',
    )) {
      const rows = await db.query(
        `SELECT t.typname,n.nspname AS schema,t.oid::text AS oid,t.typarray::text AS array_oid,
        c.oid::text AS table_oid,a.attnum,a.attnotnull,c.relkind,a.attndims,d.oid::text AS default_oid,
        pg_get_expr(d.adbin,d.adrelid) AS default_expression
        FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace cn ON cn.oid=c.relnamespace
        JOIN pg_type t ON t.oid=a.atttypid JOIN pg_namespace n ON n.oid=t.typnamespace
        LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
        WHERE cn.nspname=$1 AND c.relname=$2 AND a.attname=$3 AND NOT a.attisdropped AND t.typtype='e'`,
        [entity.schema ?? 'public', entity.tableName, column.databaseName],
      );
      if (!rows.length) continue; // New tables remain subject to the existing table policy.
      const row = rows[0];
      const oldValues = (await enumCatalog(db, row.typname)).map(
        (item) => item.label,
      );
      const newValues = (column.enum ?? []).map(String);
      // TypeORM historically compares enum membership without ordering. Leave
      // unchanged enum memberships alone; enforce order for every addition.
      if (
        oldValues.length === newValues.length &&
        oldValues.every((value) => newValues.includes(value))
      )
        continue;
      const defaultMatch = row.default_expression?.match(
        /^'([A-Za-z0-9_ -]+)'::(?:public\.)?[a-z][a-z0-9_]*$/,
      );
      if (row.default_expression && !defaultMatch)
        throw new Error('Enum default expression needs manual review');
      const change: EnumChange = {
        schema: row.schema,
        enumName: row.typname,
        table: entity.tableName,
        column: column.databaseName,
        oldValues,
        newValues,
        defaultValue: defaultMatch?.[1] ?? null,
        nullable: !row.attnotnull,
      };
      try {
        assertEnumChange(change);
      } catch (error) {
        throw new Error(
          `${change.table}.${change.column}: ${(error as Error).message}`,
        );
      }
      if (
        (entity.schema && entity.schema !== 'public') ||
        column.isArray ||
        row.attndims ||
        row.relkind !== 'r' ||
        row.typname !==
          (column.enumName ??
            `${entity.tableName}_${column.databaseName.toLowerCase()}_enum`)
      ) {
        throw new Error(
          'Enum arrays, partitions or type renames require manual review',
        );
      }
      const dependencies = await db.query(
        `SELECT classid::regclass::text AS class,objid::text AS object,objsubid AS sub,deptype
        FROM pg_depend WHERE refclassid='pg_type'::regclass AND refobjid IN ($1::oid,$2::oid)`,
        [row.oid, row.array_oid],
      );
      if (
        dependencies.some(
          (dep: any) =>
            !(
              (dep.class === 'pg_type' &&
                dep.object === row.array_oid &&
                dep.deptype === 'i') ||
              (dep.class === 'pg_class' &&
                dep.object === row.table_oid &&
                dep.sub === row.attnum &&
                dep.deptype === 'n') ||
              (dep.class === 'pg_attrdef' &&
                dep.object === row.default_oid &&
                dep.deptype === 'n')
            ),
        )
      )
        throw new Error(
          'Shared enum, array, function, view or other enum dependencies require manual review',
        );
      const collision = await db.query('SELECT to_regtype($1) AS type', [
        `public.${row.typname}_old`,
      ]);
      if (collision[0].type)
        throw new Error(
          'Enum rollback type name already exists; manual review required',
        );
      candidates.push({ change, column });
    }
  }
  if (!candidates.length) return undefined;
  if (candidates.length !== 1)
    throw new Error(
      'Additive enum v1 supports exactly one enum and one scalar column per migration',
    );
  const { change, column } = candidates[0];
  const original = column.enum;
  try {
    // Neutralize ONLY the proven label addition in memory, then ask TypeORM to
    // compare every registered entity again. No real database DDL is executed.
    column.enum = [...change.oldValues];
    const remaining = await db.driver.createSchemaBuilder().log();
    if (remaining.upQueries.length)
      throw new Error(
        `Schema diff outside additive enum scope; manual review required: ${remaining.upQueries.map((q) => q.query).join('; ')}`,
      );
  } finally {
    column.enum = original;
  }
  return change;
}

export function enumGenerationOptions(change: EnumChange) {
  return {
    name: `AddEnumValues${[change.table, change.column]
      .join('_')
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('')}`,
    tables: [change.table],
    up: enumUp(change),
    down: enumDown(change),
  };
}

// Reviewed manual migrations are not automatically re-approved. Accept the
// bounded count/throw rollback form as well as our static SQL generator form.
// Compare TypeScript tokens before executing code; reject extra JS/imports/hooks.
function sourceTokens(content: string): string {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    ts.LanguageVariant.Standard,
    content,
  );
  const tokens: unknown[] = [];
  for (
    let kind = scanner.scan();
    kind !== ts.SyntaxKind.EndOfFileToken;
    kind = scanner.scan()
  ) {
    if (
      kind === ts.SyntaxKind.StringLiteral ||
      kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
    ) {
      const value = scanner.getTokenValue();
      tokens.push([
        'string',
        /^(?:ALTER|CREATE|DROP|SELECT|LOCK|DO)\b/.test(value.trim())
          ? sqlTokens(value)
          : value,
      ]);
    } else tokens.push([kind, scanner.getTokenText()]);
  }
  return JSON.stringify(
    tokens.filter(
      (token: any, index) =>
        !(
          token[0] === ts.SyntaxKind.CommaToken &&
          (tokens[index + 1] as any)?.[0] === ts.SyntaxKind.CloseParenToken
        ),
    ),
  );
}

export function verifyReviewedEnumCandidate(
  file: string,
  content: string,
  change: EnumChange,
) {
  const identity = basename(file).match(/^(\d{13})-([A-Z][A-Za-z0-9]+)\.ts$/);
  if (!identity) throw new Error('Invalid reviewed enum migration identity');
  const name = identity[2] + identity[1];
  const added = enumAddedValues(change);
  const predicate =
    added.length === 1
      ? `= '${added[0]}'`
      : `IN (${added.map((v) => `'${v}'`).join(', ')})`;
  const guard = `SELECT COUNT(*)::text AS count FROM ${enumTable(change)} WHERE "${change.column}"::text ${predicate}`;
  const queries = (statements: string[]) =>
    statements
      .map((sql) => `await queryRunner.query(${JSON.stringify(sql)});`)
      .join('\n');
  // The error text is descriptive only; extract it without evaluating the file.
  const parsed = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const messages: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isNewExpression(node) &&
      node.expression.getText(parsed) === 'Error' &&
      node.arguments?.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    )
      messages.push(node.arguments[0].text);
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  if (messages.length !== 1)
    throw new Error(
      'Reviewed enum rollback must explicitly reject values in use',
    );
  const expected = `import { MigrationInterface, QueryRunner } from 'typeorm';
export class ${name} implements MigrationInterface {
  name = '${name}';
  public async up(queryRunner: QueryRunner): Promise<void> { ${queries(enumUp(change))} }
  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: { count: string }[] = await queryRunner.query(${JSON.stringify(guard)});
    if (Number(rows[0]?.count ?? 0) > 0) { throw new Error(${JSON.stringify(messages[0])},); }
    ${queries(enumRestore(change))}
  }
}`;
  // A trailing comma in an argument list is formatting, not executable logic.
  if (sourceTokens(content) !== sourceTokens(expected))
    throw new Error(
      'Reviewed enum migration is outside the safe additive up / guarded rollback template; source retained, manual review required',
    );
  return { up: enumUp(change), down: enumRestore(change), guard, name };
}
