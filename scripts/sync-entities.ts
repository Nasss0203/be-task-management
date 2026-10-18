import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export type EntityFile = { importPath: string; className: string };

const ENTITIES_FILE = join(process.cwd(), 'src/database/entities.ts');
const MODULES_DIR = join(process.cwd(), 'src/modules');

/** Every `*.orm-entity.ts` under src/modules with its exported entity class. */
export function findEntityFiles(directory = MODULES_DIR): EntityFile[] {
  return readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.orm-entity.ts'))
    .flatMap((file) => {
      const source = readFileSync(join(directory, file), 'utf8');
      const className = source.match(
        /@Entity\([\s\S]*?\bexport\s+class\s+(\w+)/,
      )?.[1];
      if (!className) return [];
      const importPath = relative(process.cwd(), join(directory, file))
        .replace(/\\/g, '/')
        .replace(/\.ts$/, '');
      return [{ importPath, className }];
    });
}

/**
 * Adds imports for new entity files and drops imports whose file is gone.
 * The list stays explicit because the webpack build bundles entity classes.
 */
export function syncEntitiesSource(
  source: string,
  entities: EntityFile[],
  fileExists: (importPath: string) => boolean,
): { source: string; added: string[]; removed: string[] } {
  const importLine = /^import \{ (\w+) \} from '(src\/modules\/[^']+)';$/;
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const known = new Set(
    lines.flatMap((line) => line.match(importLine)?.[2] ?? []),
  );

  const removed = lines.flatMap((line) => {
    const match = line.match(importLine);
    return match && !fileExists(match[2]) ? [match[1]] : [];
  });
  const added = entities.filter((entity) => !known.has(entity.importPath));
  if (!added.length && !removed.length)
    return { source, added: [], removed: [] };

  const kept = lines.filter((line) => {
    const name = line.match(importLine)?.[1] ?? line.trim().replace(/,$/, '');
    return !removed.includes(name);
  });
  const imports = kept
    .filter((line) => importLine.test(line))
    .concat(
      added.map((e) => `import { ${e.className} } from '${e.importPath}';`),
    )
    .sort((a, b) =>
      a.match(importLine)![2].localeCompare(b.match(importLine)![2]),
    );
  const body = kept.filter((line) => !importLine.test(line));
  const close = body.lastIndexOf('];');
  if (close < 0) throw new Error('DATABASE_ENTITIES array not found');
  body.splice(close, 0, ...added.map((e) => `  ${e.className},`));
  const firstImport = body.findIndex((line) => line.startsWith('import '));
  body.splice(firstImport + 1, 0, ...imports);

  return {
    source: body.join(eol),
    added: added.map((e) => e.className),
    removed,
  };
}

if (require.main === module) {
  const current = readFileSync(ENTITIES_FILE, 'utf8');
  const result = syncEntitiesSource(current, findEntityFiles(), (path) =>
    existsSync(join(process.cwd(), `${path}.ts`)),
  );
  if (result.added.length || result.removed.length) {
    writeFileSync(ENTITIES_FILE, result.source);
    for (const name of result.added) console.log(`entities.ts: + ${name}`);
    for (const name of result.removed) console.log(`entities.ts: - ${name}`);
  }
}
