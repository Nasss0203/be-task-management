import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * STATUS properties now always have a value (new rows and newly added STATUS
 * properties start at the first option). Rows created before that have no
 * value; give them the property's first option by numeric position, matching
 * DatabaseProperty.getDefaultOption(). Existing values are never overwritten.
 */
export class BackfillDatabaseStatusDefaults1792400000000 implements MigrationInterface {
  name = 'BackfillDatabaseStatusDefaults1792400000000';

  async up(runner: QueryRunner): Promise<void> {
    const defaultOption = `
      SELECT o.id
      FROM database_property_options o
      WHERE o.property_id = p.id
      ORDER BY
        CASE WHEN o.position ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN o.position::numeric END NULLS LAST,
        o.position,
        o.id
      LIMIT 1
    `;

    // Rows that have a stored-but-empty value for the property.
    await runner.query(`
      UPDATE database_row_values v
      SET value = to_jsonb(first_option.id::text)
      FROM database_properties p
      CROSS JOIN LATERAL (${defaultOption}) first_option
      WHERE v.property_id = p.id
        AND p.type::text = 'STATUS'
        AND (v.value IS NULL OR v.value = 'null'::jsonb)
    `);

    // Rows with no value record at all for the property.
    await runner.query(`
      INSERT INTO database_row_values (id, row_id, property_id, value)
      SELECT uuid_generate_v4(), r.id, p.id, to_jsonb(first_option.id::text)
      FROM database_properties p
      JOIN database_rows r ON r.database_id = p.database_id
      CROSS JOIN LATERAL (${defaultOption}) first_option
      WHERE p.type::text = 'STATUS'
        AND NOT EXISTS (
          SELECT 1
          FROM database_row_values v
          WHERE v.row_id = r.id AND v.property_id = p.id
        )
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'Status default backfill cannot be reverted safely: backfilled values are indistinguishable from values users set',
    );
  }
}
