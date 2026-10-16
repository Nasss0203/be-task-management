/** Deliberately bounded v1: one existing public enum, one scalar table column. */
export const ENUM_POLICY = 'additive-enum-v1';
export const ENUM_CHECKPOINT_POLICY = 'isolated-additive-enum-v1';

export type EnumChange = {
  schema: 'public';
  enumName: string;
  table: string;
  column: string;
  oldValues: string[];
  newValues: string[];
  defaultValue: string | null;
  nullable: boolean;
};

export function assertEnumChange(change: EnumChange): void {
  if (
    change.schema !== 'public' ||
    [change.enumName, change.table, change.column].some(
      (value) => !/^[a-z][a-z0-9_]*$/.test(value) || value.length > 58,
    ) ||
    !change.oldValues.length ||
    change.newValues.length <= change.oldValues.length ||
    [change.oldValues, change.newValues].some(
      (values) =>
        new Set(values).size !== values.length ||
        values.some(
          (value) =>
            typeof value !== 'string' ||
            !/^[A-Za-z0-9_ -]+$/.test(value) ||
            Buffer.byteLength(value) > 63,
        ),
    ) ||
    JSON.stringify(
      change.newValues.filter((value) => change.oldValues.includes(value)),
    ) !== JSON.stringify(change.oldValues) ||
    (change.defaultValue !== null &&
      !change.oldValues.includes(change.defaultValue)) ||
    typeof change.nullable !== 'boolean'
  ) {
    throw new Error(
      'Additive enum policy rejects removal, rename, reordering, unsupported labels/identifiers or a changed default; manual review required',
    );
  }
}

export const enumType = (change: EnumChange) => `"public"."${change.enumName}"`;
export const enumTable = (change: EnumChange) => `"public"."${change.table}"`;
export const enumAddedValues = (change: EnumChange) =>
  change.newValues.filter((value) => !change.oldValues.includes(value));

export function enumUp(change: EnumChange): string[] {
  assertEnumChange(change);
  const current = [...change.oldValues];
  const queries: string[] = [];
  for (let index = 0; index < change.newValues.length; index++) {
    const value = change.newValues[index];
    if (current.includes(value)) continue;
    const neighbor = current[index];
    queries.push(
      `ALTER TYPE ${enumType(change)} ADD VALUE IF NOT EXISTS '${value}'${neighbor ? ` BEFORE '${neighbor}'` : ''}`,
    );
    current.splice(index, 0, value);
  }
  return queries;
}

export function enumRestore(change: EnumChange): string[] {
  assertEnumChange(change);
  const column = `ALTER TABLE ${enumTable(change)} ALTER COLUMN "${change.column}"`;
  return [
    `ALTER TYPE ${enumType(change)} RENAME TO "${change.enumName}_old"`,
    `CREATE TYPE ${enumType(change)} AS ENUM (${change.oldValues.map((v) => `'${v}'`).join(', ')})`,
    ...(change.defaultValue === null ? [] : [`${column} DROP DEFAULT`]),
    `${column} TYPE ${enumType(change)} USING "${change.column}"::text::${enumType(change)}`,
    ...(change.defaultValue === null
      ? []
      : [`${column} SET DEFAULT '${change.defaultValue}'`]),
    `DROP TYPE "public"."${change.enumName}_old"`,
  ];
}

export function enumDown(change: EnumChange): string[] {
  return [
    `LOCK TABLE ${enumTable(change)} IN ACCESS EXCLUSIVE MODE`,
    `DO $$ BEGIN IF EXISTS (SELECT 1 FROM ${enumTable(change)} WHERE "${change.column}"::text IN (${enumAddedValues(
      change,
    )
      .map((v) => `'${v}'`)
      .join(
        ', ',
      )})) THEN RAISE EXCEPTION 'Cannot rollback: additive enum values are in use'; END IF; END $$`,
    ...enumRestore(change),
  ];
}

// Whitespace outside quoted tokens is immaterial; literals are never rewritten.
export function sqlTokens(sql: string): string {
  return (
    sql.match(
      /'(?:''|[^'])*'|"(?:""|[^"])*"|[A-Za-z_][A-Za-z0-9_]*|\d+|[^\s]/g,
    ) ?? []
  ).join(' ');
}

/** Compare the WHOLE dump, replacing exactly the catalog-proven enum block. */
export function enumSchemaBefore(after: string, change: EnumChange): string {
  assertEnumChange(change);
  const block = (values: string[]) =>
    `CREATE TYPE public.${change.enumName} AS ENUM (\n${values.map((value) => `    '${value}'`).join(',\n')}\n);`;
  const normalized = after.replace(/\r\n/g, '\n');
  const expected = block(change.newValues);
  if (normalized.split(expected).length !== 2)
    throw new Error('Expected enum schema block missing or ambiguous');
  return normalized.replace(expected, block(change.oldValues));
}
