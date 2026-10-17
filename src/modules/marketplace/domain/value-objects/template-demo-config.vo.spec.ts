import {
  TEMPLATE_DEMO_LIMITS,
  TemplateDemoConfig,
  TemplateDemoScope,
} from './template-demo-config.vo';

const BLOCK = '11111111-1111-4111-8111-111111111111';
const DB = '22222222-2222-4222-8222-222222222222';
const VIEW = '33333333-3333-4333-8333-333333333333';
const PROP = '44444444-4444-4444-8444-444444444444';
const ROW = '55555555-5555-4555-8555-555555555555';

const limited = (overrides: Record<string, unknown> = {}) => ({
  schema: 1,
  scope: 'LIMITED',
  block_ids: [BLOCK],
  databases: {
    [DB]: { view_ids: [VIEW], property_ids: [PROP], row_limit: 3 },
  },
  ...overrides,
});

describe('TemplateDemoConfig', () => {
  it('treats absent and legacy (schema-less) configs as no config', () => {
    expect(TemplateDemoConfig.parse(null)).toBeNull();
    expect(TemplateDemoConfig.parse(undefined)).toBeNull();
    expect(TemplateDemoConfig.parse({ sandbox: true })).toBeNull();
  });

  it('parses a LIMITED config and normalises ids to lower case', () => {
    const config = TemplateDemoConfig.parse(
      limited({ block_ids: [BLOCK.toUpperCase()] }),
    )!;

    expect(config.getScope()).toBe(TemplateDemoScope.LIMITED);
    expect(config.getBlockIds().has(BLOCK)).toBe(true);
    expect(config.getDatabaseRules(DB.toUpperCase())).toMatchObject({
      rowLimit: 3,
      rowIds: null,
    });
  });

  it('parses a FULL_VERSION config', () => {
    expect(
      TemplateDemoConfig.parse({
        schema: 1,
        scope: 'FULL_VERSION',
      })!.isLimited(),
    ).toBe(false);
  });

  it.each([
    ['unknown schema', { schema: 2, scope: 'LIMITED' }],
    ['unknown scope', limited({ scope: 'EVERYTHING' })],
    ['empty block list', limited({ block_ids: [] })],
    ['non-uuid block id', limited({ block_ids: ['abc'] })],
    [
      'database without views',
      limited({ databases: { [DB]: { view_ids: [], row_limit: 1 } } }),
    ],
    [
      'both row_ids and row_limit',
      limited({
        databases: { [DB]: { view_ids: [VIEW], row_ids: [ROW], row_limit: 1 } },
      }),
    ],
    [
      'neither row_ids nor row_limit',
      limited({ databases: { [DB]: { view_ids: [VIEW] } } }),
    ],
    [
      'row_limit above the cap',
      limited({
        databases: {
          [DB]: {
            view_ids: [VIEW],
            row_limit: TEMPLATE_DEMO_LIMITS.maxRowLimit + 1,
          },
        },
      }),
    ],
    ['array instead of object', []],
  ])('rejects %s', (_, raw) => {
    expect(() => TemplateDemoConfig.parse(raw)).toThrow();
    expect(TemplateDemoConfig.tryParse(raw)).toBe('INVALID');
  });

  it('caps the total number of referenced ids', () => {
    const ids = Array.from(
      { length: TEMPLATE_DEMO_LIMITS.maxIds + 1 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    );
    expect(() => TemplateDemoConfig.parse(limited({ block_ids: ids }))).toThrow(
      /at most/,
    );
  });
});
