export const TEMPLATE_DEMO_CONFIG_SCHEMA_VERSION = 1;

export enum TemplateDemoScope {
  /** The whole demo version is public (a separate demo version). */
  FULL_VERSION = 'FULL_VERSION',
  /** Only allowlisted content of the demo version is public. */
  LIMITED = 'LIMITED',
}

/** Hard caps that keep a stored config and its filtered output bounded. */
export const TEMPLATE_DEMO_LIMITS = {
  maxIds: 500,
  maxRowLimit: 20,
} as const;

export type TemplateDemoDatabaseRules = {
  viewIds: ReadonlySet<string>;
  propertyIds: ReadonlySet<string>;
  /** Explicit row allowlist; takes precedence over rowLimit. */
  rowIds: ReadonlySet<string> | null;
  rowLimit: number | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Versioned shape of `template_listings.demo_config`.
 *
 * Stored JSON (schema 1):
 * {
 *   "schema": 1,
 *   "scope": "LIMITED",
 *   "block_ids": ["<uuid>"],
 *   "databases": {
 *     "<template_database_id>": {
 *       "view_ids": ["<uuid>"], "property_ids": ["<uuid>"],
 *       "row_ids": ["<uuid>"] | "row_limit": 5
 *     }
 *   }
 * }
 *
 * Objects without `schema` are legacy free-form configs from before schema 1;
 * they never grant LIMITED behaviour and are treated as "no config".
 */
export class TemplateDemoConfig {
  private constructor(
    private readonly scope: TemplateDemoScope,
    private readonly blockIds: ReadonlySet<string>,
    private readonly databases: ReadonlyMap<string, TemplateDemoDatabaseRules>,
  ) {}

  /**
   * Strict parse used on writes. Returns null for absent/legacy configs and
   * throws for a schema-1 config that is invalid.
   */
  static parse(raw: unknown): TemplateDemoConfig | null {
    if (raw === null || raw === undefined) return null;
    if (!isPlainObject(raw)) {
      throw new Error('demo_config must be an object');
    }
    if (!('schema' in raw)) return null;
    if (raw.schema !== TEMPLATE_DEMO_CONFIG_SCHEMA_VERSION) {
      throw new Error('Unsupported demo_config schema version');
    }

    if (raw.scope === TemplateDemoScope.FULL_VERSION) {
      return new TemplateDemoConfig(
        TemplateDemoScope.FULL_VERSION,
        new Set(),
        new Map(),
      );
    }
    if (raw.scope !== TemplateDemoScope.LIMITED) {
      throw new Error('demo_config.scope must be LIMITED or FULL_VERSION');
    }

    let idCount = 0;
    const countIds = (ids: Set<string>) => {
      idCount += ids.size;
      if (idCount > TEMPLATE_DEMO_LIMITS.maxIds) {
        throw new Error(
          `demo_config may reference at most ${TEMPLATE_DEMO_LIMITS.maxIds} ids`,
        );
      }
      return ids;
    };

    const blockIds = countIds(parseIdList(raw.block_ids, 'block_ids'));
    if (blockIds.size === 0) {
      throw new Error('demo_config.block_ids must list at least one block');
    }

    const rawDatabases = raw.databases ?? {};
    if (!isPlainObject(rawDatabases)) {
      throw new Error('demo_config.databases must be an object');
    }

    const databases = new Map<string, TemplateDemoDatabaseRules>();
    for (const [databaseId, rawRules] of Object.entries(rawDatabases)) {
      const path = `databases.${databaseId}`;
      if (!UUID_PATTERN.test(databaseId)) {
        throw new Error(`demo_config.${path} is not a valid id`);
      }
      if (!isPlainObject(rawRules)) {
        throw new Error(`demo_config.${path} must be an object`);
      }
      countIds(new Set([databaseId]));

      const viewIds = countIds(
        parseIdList(rawRules.view_ids, `${path}.view_ids`),
      );
      if (viewIds.size === 0) {
        throw new Error(
          `demo_config.${path}.view_ids must list at least one view`,
        );
      }
      const propertyIds = countIds(
        parseIdList(rawRules.property_ids ?? [], `${path}.property_ids`),
      );

      const hasRowIds = rawRules.row_ids !== undefined;
      const hasRowLimit = rawRules.row_limit !== undefined;
      if (hasRowIds === hasRowLimit) {
        throw new Error(
          `demo_config.${path} must define exactly one of row_ids or row_limit`,
        );
      }

      let rowIds: Set<string> | null = null;
      let rowLimit: number | null = null;
      if (hasRowIds) {
        rowIds = countIds(parseIdList(rawRules.row_ids, `${path}.row_ids`));
        if (rowIds.size > TEMPLATE_DEMO_LIMITS.maxRowLimit) {
          throw new Error(
            `demo_config.${path}.row_ids may list at most ${TEMPLATE_DEMO_LIMITS.maxRowLimit} rows`,
          );
        }
      } else {
        const limit = rawRules.row_limit;
        if (
          typeof limit !== 'number' ||
          !Number.isInteger(limit) ||
          limit < 0 ||
          limit > TEMPLATE_DEMO_LIMITS.maxRowLimit
        ) {
          throw new Error(
            `demo_config.${path}.row_limit must be an integer between 0 and ${TEMPLATE_DEMO_LIMITS.maxRowLimit}`,
          );
        }
        rowLimit = limit;
      }

      databases.set(databaseId.toLowerCase(), {
        viewIds,
        propertyIds,
        rowIds,
        rowLimit,
      });
    }

    return new TemplateDemoConfig(
      TemplateDemoScope.LIMITED,
      blockIds,
      databases,
    );
  }

  /** Lenient parse for reads: an invalid stored config grants nothing. */
  static tryParse(raw: unknown): TemplateDemoConfig | null | 'INVALID' {
    try {
      return TemplateDemoConfig.parse(raw);
    } catch {
      return 'INVALID';
    }
  }

  getScope(): TemplateDemoScope {
    return this.scope;
  }

  isLimited(): boolean {
    return this.scope === TemplateDemoScope.LIMITED;
  }

  getBlockIds(): ReadonlySet<string> {
    return this.blockIds;
  }

  getDatabaseRules(databaseId: string): TemplateDemoDatabaseRules | undefined {
    return this.databases.get(databaseId.toLowerCase());
  }

  getDatabaseIds(): string[] {
    return [...this.databases.keys()];
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseIdList(value: unknown, path: string): Set<string> {
  if (!Array.isArray(value)) {
    throw new Error(`demo_config.${path} must be an array of ids`);
  }
  const ids = new Set<string>();
  for (const id of value) {
    if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
      throw new Error(`demo_config.${path} contains an invalid id`);
    }
    ids.add(id.toLowerCase());
  }
  return ids;
}
