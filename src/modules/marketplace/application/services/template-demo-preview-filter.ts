import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { TemplatePreviewResponseDto } from 'src/modules/template/application/dto/template-preview/template-preview.response.dto';

import {
  TEMPLATE_DEMO_LIMITS,
  TemplateDemoConfig,
} from '../../domain/value-objects/template-demo-config.vo';

export type TemplateDemoHiddenContent = { blocks: number; rows: number };

/** Never exposed in a LIMITED demo, even when allowlisted. */
const PRIVATE_PROPERTY_TYPES = new Set<PropertyType>([
  PropertyType.PERSON,
  PropertyType.CREATED_BY,
  PropertyType.FILE,
]);
const PRIVATE_BLOCK_TYPES = new Set<PageBlockType>([PageBlockType.FILE]);

/** Keys that point at private storage objects. */
const PRIVATE_KEYS = new Set([
  'attachmentId',
  'attachment_id',
  'attachmentIds',
  'attachment_ids',
  'storageKey',
  'storage_key',
  'fileKey',
  'file_key',
]);
const URL_KEYS = new Set([
  'url',
  'src',
  'href',
  'thumbnailUrl',
  'thumbnail_url',
]);
const SIGNED_URL_PATTERN =
  /[?&](x-amz-signature|x-amz-credential|signature|sig|token|expires)=/i;

type Block = TemplatePreviewResponseDto['blocks'][number];
type Database = TemplatePreviewResponseDto['databases'][number];

/**
 * Rejects configs that reference ids outside this version's snapshot. Run on
 * every write and again before serving, so a stale config fails closed.
 */
export function assertDemoConfigMatchesSnapshot(
  config: TemplateDemoConfig,
  preview: TemplatePreviewResponseDto,
): void {
  if (!config.isLimited()) return;

  const blockIds = new Set(
    preview.blocks.map((block) => block.id.toLowerCase()),
  );
  for (const id of config.getBlockIds()) {
    if (!blockIds.has(id)) {
      throw new Error(
        `demo_config block ${id} is not part of the demo version`,
      );
    }
  }

  const databases = new Map(
    preview.databases.map((database) => [database.id.toLowerCase(), database]),
  );
  for (const databaseId of config.getDatabaseIds()) {
    const database = databases.get(databaseId);
    if (!database) {
      throw new Error(
        `demo_config database ${databaseId} is not part of the demo version`,
      );
    }
    const rules = config.getDatabaseRules(databaseId)!;
    assertSubset(
      rules.viewIds,
      database.views,
      `views of database ${databaseId}`,
    );
    assertSubset(
      rules.propertyIds,
      database.properties,
      `properties of database ${databaseId}`,
    );
    if (rules.rowIds) {
      assertSubset(
        rules.rowIds,
        database.rows,
        `rows of database ${databaseId}`,
      );
    }
  }
}

/**
 * Builds the public view of a LIMITED demo. Strict allowlist: anything not
 * explicitly allowed is dropped. The input preview is never mutated.
 */
export function applyTemplateDemoFilter(
  preview: TemplatePreviewResponseDto,
  config: TemplateDemoConfig,
): { preview: TemplatePreviewResponseDto; hidden: TemplateDemoHiddenContent } {
  if (!config.isLimited()) {
    throw new Error('Only LIMITED demo configs can be applied as a filter');
  }

  const blocksById = new Map(preview.blocks.map((block) => [block.id, block]));
  const visibility = new Map<string, boolean>();

  const isVisible = (block: Block, depth = 0): boolean => {
    const cached = visibility.get(block.id);
    if (cached !== undefined) return cached;
    let visible =
      depth <= preview.blocks.length &&
      config.getBlockIds().has(block.id.toLowerCase()) &&
      !PRIVATE_BLOCK_TYPES.has(block.type) &&
      isAllowedDatabaseView(block, config);
    if (visible && block.parent_block_id) {
      const parent = blocksById.get(block.parent_block_id);
      // Orphans and children of hidden blocks stay hidden.
      visible = parent ? isVisible(parent, depth + 1) : false;
    }
    visibility.set(block.id, visible);
    return visible;
  };

  const blocks = preview.blocks
    .filter((block) => isVisible(block))
    .map(sanitizeBlock);

  const referencedDatabaseIds = new Set(
    blocks
      .filter((block) => block.type === PageBlockType.DATABASE_VIEW)
      .map((block) =>
        String(getDatabaseViewRef(block).databaseId).toLowerCase(),
      ),
  );

  let totalRows = 0;
  let keptRows = 0;
  const databases: Database[] = [];
  for (const database of preview.databases) {
    totalRows += database.rows.length;
    const rules = config.getDatabaseRules(database.id);
    if (!rules || !referencedDatabaseIds.has(database.id.toLowerCase()))
      continue;

    const properties = database.properties.filter(
      (property) =>
        !PRIVATE_PROPERTY_TYPES.has(property.type) &&
        (property.type === PropertyType.TITLE ||
          rules.propertyIds.has(property.id.toLowerCase())),
    );
    const propertyIds = new Set(properties.map((property) => property.id));

    const rows = (
      rules.rowIds
        ? database.rows.filter((row) => rules.rowIds!.has(row.id.toLowerCase()))
        : database.rows.slice(0, rules.rowLimit ?? 0)
    )
      .slice(0, TEMPLATE_DEMO_LIMITS.maxRowLimit)
      .map((row) => ({
        ...row,
        values: row.values
          .filter((value) => propertyIds.has(value.template_property_id))
          .map((value) => ({ ...value, value: structuredClone(value.value) })),
      }));
    keptRows += rows.length;

    databases.push({
      ...database,
      properties: properties.map((property) => ({
        ...property,
        options: property.options.map((option) => ({ ...option })),
      })),
      rows,
      views: database.views
        .filter((view) => rules.viewIds.has(view.id.toLowerCase()))
        .map((view) => ({
          ...view,
          properties: view.properties
            .filter((viewProperty) =>
              propertyIds.has(viewProperty.template_property_id),
            )
            .map((viewProperty) => ({ ...viewProperty })),
        })),
    } as Database);
  }

  return {
    preview: new TemplatePreviewResponseDto({
      template: preview.template,
      version: preview.version,
      blocks,
      databases,
    }),
    hidden: {
      blocks: preview.blocks.length - blocks.length,
      rows: totalRows - keptRows,
    },
  };
}

function isAllowedDatabaseView(
  block: Block,
  config: TemplateDemoConfig,
): boolean {
  if (block.type !== PageBlockType.DATABASE_VIEW) return true;
  const { databaseId, viewId } = getDatabaseViewRef(block);
  if (typeof databaseId !== 'string' || typeof viewId !== 'string')
    return false;
  const rules = config.getDatabaseRules(databaseId);
  return Boolean(rules?.viewIds.has(viewId.toLowerCase()));
}

function getDatabaseViewRef(block: Block): {
  databaseId: unknown;
  viewId: unknown;
} {
  const dataConfig = block.data_config;
  if (
    typeof dataConfig !== 'object' ||
    dataConfig === null ||
    Array.isArray(dataConfig)
  ) {
    return { databaseId: undefined, viewId: undefined };
  }
  const record = dataConfig as Record<string, unknown>;
  return { databaseId: record.database_id, viewId: record.view_id };
}

function sanitizeBlock(block: Block): Block {
  return {
    ...block,
    content: sanitizeJson(block.content) as Block['content'],
    data_config: sanitizeJson(block.data_config) as Block['data_config'],
    style_config: structuredClone(block.style_config),
  } as Block;
}

/** Drops private storage references and signed/non-http URLs, recursively. */
function sanitizeJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeJson);
  if (typeof value !== 'object' || value === null) return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_KEYS.has(key)) continue;
    if (URL_KEYS.has(key) && typeof child === 'string' && !isPublicUrl(child)) {
      continue;
    }
    result[key] = sanitizeJson(child);
  }
  return result;
}

function isPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      !SIGNED_URL_PATTERN.test(url.search)
    );
  } catch {
    return false;
  }
}

function assertSubset(
  ids: ReadonlySet<string>,
  items: { id: string }[],
  label: string,
): void {
  const known = new Set(items.map((item) => item.id.toLowerCase()));
  for (const id of ids) {
    if (!known.has(id)) {
      throw new Error(
        `demo_config references ${id}, which is not in the ${label}`,
      );
    }
  }
}
