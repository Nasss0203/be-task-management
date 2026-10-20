import fs from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

import {
  baselineDirectory,
  baselineLineage,
  canonicalSchema,
  checkpointEvidenceGaps,
  checkpointFor,
  loadBaseline,
  schemaHash,
} from './baseline';

import { databaseOptions, migrationFiles } from './database-options';
import { inspectHistory, type HistoryRow } from './migration-safety';
import { staticMigrationNames } from './migration-verification';

describe('Actual ADD PAID checkpoint and Pricing retry', () => {
  it.each(['\n', '\r\n'])(
    'loads unchanged baseline with %j line endings',
    (ending) => {
      const read = fs.readFileSync;

      const spy = jest
        .spyOn(fs, 'readFileSync')
        .mockImplementation((...args) => {
          const result = read(...args);

          return String(args[0]) === join(baselineDirectory(), 'schema.sql')
            ? String(result).replace(/\r\n/g, '\n').replace(/\n/g, ending)
            : result;
        });

      try {
        expect(loadBaseline().legacyHistory).toHaveLength(45);
      } finally {
        spy.mockRestore();
      }
    },
  );

  it('still rejects an unbalanced restriction key', () => {
    const read = fs.readFileSync;

    const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((...args) => {
      const result = read(...args);

      return String(args[0]) === join(baselineDirectory(), 'schema.sql')
        ? String(result).replace(
            /\\unrestrict [A-Za-z0-9]+/,
            '\\unrestrict DifferentKey',
          )
        : result;
    });

    try {
      expect(() => loadBaseline()).toThrow(
        'Baseline has unreviewed or unbalanced psql metacommands',
      );
    } finally {
      spy.mockRestore();
    }
  });

  const names = [
    'AddPaidTemplateOffer1791810000000',
    'AddTemplateListingPricing1791810001000',
  ];

  it('pins actual intermediate SQL and limits its schema change to the PAID enum label', () => {
    const manifest = loadBaseline();

    const checkpoint = checkpointFor(names.slice(0, 1), manifest)!;

    const actual = fs.readFileSync(
      join(baselineDirectory(), checkpoint.schemaFile!),
      'utf8',
    );

    const baseline = fs.readFileSync(
      join(baselineDirectory(), 'roundtrip-schema.sql'),
      'utf8',
    );

    expect(schemaHash(actual)).toBe(
      '065c7c6dd8010f70842de849d96200981e24ac06b766914909387786710a4024',
    );

    expect(canonicalSchema(actual)).toBe(
      canonicalSchema(baseline).replace(
        "CREATE TYPE public.template_listings_offer_type_enum AS ENUM (\n    'FREE'\n);",
        "CREATE TYPE public.template_listings_offer_type_enum AS ENUM (\n    'FREE',\n    'PAID'\n);",
      ),
    );

    expect(actual).not.toMatch(
      /^COPY |^INSERT INTO |price_amount|CHK_template_listings_pricing/m,
    );

    expect(checkpointEvidenceGaps(names, manifest)).toEqual([]);
  });

  // Evidence from a verified intermediate database state.
  // Skip this integration-evidence test if the real artifact is absent.
  // Skipping does not mean the database state was verified.
  const evidencePath = join(
    process.cwd(),
    'docs/baseline/intermediate-checkpoint-verification.json',
  );

  const itWithEvidence = fs.existsSync(evidencePath) ? it : it.skip;

  itWithEvidence(
    'recognizes the real 46-row state with only Pricing pending and rejects edited legacy history',
    () => {
      const manifest = loadBaseline();

      const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8')) as {
        history: HistoryRow[];
      };

      expect(evidence.history).toHaveLength(46);

      const lineage = baselineLineage(evidence.history, manifest);

      expect(lineage.valid).toBe(true);

      expect(lineage.incremental.map((row) => row.name)).toEqual(
        names.slice(0, 1),
      );

      const history = inspectHistory(names, evidence.history, lineage.legacy);

      expect(history.errors).toEqual([]);

      expect(history.pending).toEqual(names.slice(1));

      expect(history.coveredByBaseline).toHaveLength(45);

      const edited = evidence.history.map((row, index) =>
        index === 0 ? { ...row, id: 999 } : row,
      );

      expect(baselineLineage(edited, manifest).valid).toBe(false);
    },
  );

  // Pure unit test: verifies lineage handling without
  // pretending that a constructed history is real DB evidence.
  it('validates a constructed baseline history with one incremental migration', () => {
    const manifest = loadBaseline();

    const legacyHistory = manifest.legacyHistory;

    const nextId = Math.max(...legacyHistory.map((row) => Number(row.id))) + 1;

    const history: HistoryRow[] = [
      ...legacyHistory,
      {
        id: nextId,
        timestamp: Number(names[0].slice(-13)),
        name: names[0],
      },
    ];

    expect(history).toHaveLength(46);

    const lineage = baselineLineage(history, manifest);

    expect(lineage.valid).toBe(true);

    expect(lineage.incremental.map((row) => row.name)).toEqual(
      names.slice(0, 1),
    );

    const result = inspectHistory(names, history, lineage.legacy);

    expect(result.errors).toEqual([]);

    expect(result.pending).toEqual(names.slice(1));

    expect(result.coveredByBaseline).toHaveLength(45);

    const tampered = history.map((row, index) =>
      index === 0 ? { ...row, id: 999 } : row,
    );

    expect(baselineLineage(tampered, manifest).valid).toBe(false);
  });

  it('rejects tampered intermediate evidence without accepting the pinned manifest hash', () => {
    const read = fs.readFileSync;

    const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((...args) => {
      const result = read(...args);

      return String(args[0]).endsWith('after-paid-template-offer.sql')
        ? String(result).replace("'PAID'", "'UNREVIEWED'")
        : result;
    });

    try {
      expect(() => loadBaseline()).toThrow('Checkpoint SQL integrity mismatch');
    } finally {
      spy.mockRestore();
    }
  });

  it('discovers only incremental classes without opening a database connection', async () => {
    const connect = jest.spyOn(DataSource.prototype, 'initialize');

    try {
      const discovered = await staticMigrationNames(
        databaseOptions(() => undefined),
      );
      // Migrations added later (on any branch) extend this list.
      expect(discovered).toHaveLength(migrationFiles().length);
      expect(discovered.slice(0, names.length + 8)).toEqual([
        ...names,
        'CreateTemplatePurchases1791903351862',
        'AddPaidPurchaseEntitlementSource1791958800000',
        'CreateMarketplaceWebhookEvents1791986191301',
        'AddTemplateListingPreviewMode1792050000000',
        'AddTemplateListingDemoPreview1792100000000',
        'CreateTemplateMarketplaceReleases1792100000001',
        'BackfillOfficialMarketplaceReleases1792200000000',
        'AddAiConversationScope1792300000000',
      ]);

      expect(connect).not.toHaveBeenCalled();
    } finally {
      connect.mockRestore();
    }
  });
});
