import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Backfills only the currently selected, published marketplace listing version.
 * Listing published_at records a real publish event; creator identity is not
 * proof of who performed it, so historical released_by remains NULL.
 * A paid purchase proves availability but does not timestamp the release.
 */
export class BackfillOfficialMarketplaceReleases1792200000000 implements MigrationInterface {
  name = 'BackfillOfficialMarketplaceReleases1792200000000';

  async up(runner: QueryRunner): Promise<void> {
    const conflicts: Array<{ template_id: string; version_id: string }> =
      await runner.query(`
        SELECT DISTINCT p.template_id, p.published_version_id AS version_id
        FROM template_purchases p
        JOIN template_entitlements e
          ON e.id = p.entitlement_id
         AND e.template_id = p.template_id
         AND e.user_id = p.buyer_id
         AND e.source::text = 'PAID_PURCHASE'
        JOIN template_listings l
          ON l.id = p.listing_id
         AND l.template_id = p.template_id
         AND l.published_version_id = p.published_version_id
        WHERE p.status = 'PAID'
          AND p.paid_at IS NOT NULL
          AND (l.offer_type::text <> 'PAID'
               OR l.demo_version_id = p.published_version_id)
      `);
    if (conflicts.length) {
      throw new Error(
        `Marketplace release backfill found ${conflicts.length} conflicting paid purchase/listing pairs; review before applying`,
      );
    }

    await runner.query(`
      INSERT INTO template_marketplace_releases
        (template_id, version_id, released_at, released_by, offer_type_at_release)
      SELECT l.template_id,
             l.published_version_id,
             l.published_at,
             NULL,
             l.offer_type::text
      FROM template_listings l
      JOIN page_template_versions v
        ON v.id = l.published_version_id
       AND v.template_id = l.template_id
      WHERE l.status::text = 'PUBLISHED'
        AND v.status::text = 'PUBLISHED'
        AND l.published_at IS NOT NULL
        AND v.published_at IS NOT NULL
        AND v.published_at <= l.published_at
        AND l.offer_type::text IN ('FREE', 'PAID')
        AND l.published_version_id IS DISTINCT FROM l.demo_version_id
      ON CONFLICT ON CONSTRAINT "UQ_template_marketplace_releases_template_version"
      DO NOTHING
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'Official marketplace release backfill is historical data and cannot be reverted safely',
    );
  }
}
