import { readdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { DataSourceOptions } from 'typeorm';
import { DATABASE_ENTITIES } from './entities';
import { BASELINE_CUTOFF } from './baseline-config';

// Preserve shared migration bytes, but never execute its unreviewed global diff.
export const QUARANTINED_MIGRATIONS = ['InitSchema1791809659487'];

export function migrationFiles(
  directory = existsSync(join(__dirname, 'migrations'))
    ? join(__dirname, 'migrations')
    : join(__dirname, 'database', 'migrations'),
  extension = extname(__filename),
  scope: 'incremental' | 'review' = 'incremental',
): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter(
      (file) => /^\d{13}-.+\.(ts|js)$/.test(file) && file.endsWith(extension),
    )
    .filter((file) => !file.startsWith('1791809659487-'))
    .filter(
      (file) =>
        scope === 'review' || Number(file.slice(0, 13)) > BASELINE_CUTOFF,
    )
    .sort()
    .map((file) => join(directory, file));
}

export function databaseOptions(
  get: (key: string) => string | undefined,
): DataSourceOptions {
  if (get('DB_SYNCHRONIZE') === 'true') {
    throw new Error(
      'DB_SYNCHRONIZE=true is disabled. Apply reviewed migrations to a verified database instead.',
    );
  }
  return {
    type: 'postgres',
    host: get('DB_HOST'),
    port: Number(get('DB_PORT') ?? 5432),
    username: get('DB_USER'),
    password: get('DB_PASSWORD'),
    database: get('DB_NAME'),
    schema: 'public',
    synchronize: false,
    migrationsRun: false,
    migrationsTransactionMode: 'each',
    installExtensions: false,
    logging: false,
    entities: DATABASE_ENTITIES,
    migrations: migrationFiles(),
  };
}
