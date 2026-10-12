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
import { databaseOptions } from './database-options';
import { inspectHistory } from './migration-safety';
import { staticMigrationNames } from './migration-verification';

describe('Actual ADD PAID checkpoint and Pricing retry', () => {
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

  it('recognizes the real 46-row state with only Pricing pending and rejects edited legacy history', () => {
    const manifest = loadBaseline();
    const evidence = JSON.parse(
      fs.readFileSync(
        join(
          process.cwd(),
          'docs/baseline/intermediate-checkpoint-verification.json',
        ),
        'utf8',
      ),
    );
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

  it('discovers only the two incremental classes without opening a database connection', async () => {
    const connect = jest.spyOn(DataSource.prototype, 'initialize');
    try {
      expect(
        await staticMigrationNames(databaseOptions(() => undefined)),
      ).toEqual(names);
      expect(connect).not.toHaveBeenCalled();
    } finally {
      connect.mockRestore();
    }
  });
});
