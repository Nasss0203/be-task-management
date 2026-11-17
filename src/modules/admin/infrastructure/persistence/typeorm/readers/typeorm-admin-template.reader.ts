import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type { TemplateListingStatus } from 'src/modules/marketplace/domain/enums/template-listing-status.enum';
import type { TemplateOfferType } from 'src/modules/marketplace/domain/enums/template-offer-type.enum';

import {
  AdminTemplateOfferFilter,
  AdminTemplateStatusFilter,
  type AdminTemplateReader,
  type AdminTemplatesOverview,
  type ListAdminTemplatesInput,
  type ListAdminTemplatesResult,
} from '../../../../application/ports/admin-template-reader.port';

interface OverviewRawRow {
  listings: number | string;
  published: number | string;
  draft: number | string;
  paid: number | string;
  free: number | string;
  grossSales: string;
}

interface TemplateRawRow {
  listingId: string;
  templateId: string;
  templateName: string;
  coverUrl: string | null;
  creatorId: string;
  creatorEmail: string;
  creatorUsername: string;
  workspaceId: string;
  workspaceName: string;
  status: TemplateListingStatus;
  offerType: TemplateOfferType;
  priceAmount: string;
  currency: string;
  categories: Array<{ id: string; name: string }>;
  likes: number | string;
  reviews: number | string;
  averageRating: number | string | null;
  paidPurchases: number | string;
  grossSales: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
}

const TEMPLATES_FROM = `
  FROM template_listings listing
  INNER JOIN page_templates template ON template.id = listing.template_id
  INNER JOIN users creator ON creator.id = listing.created_by
  INNER JOIN workspaces workspace ON workspace.id = template.workspace_id
  WHERE (
      $1::text IS NULL
      OR template.name ILIKE '%' || $1 || '%'
      OR creator.email ILIKE '%' || $1 || '%'
      OR creator.username ILIKE '%' || $1 || '%'
    )
    AND ($2::text IS NULL OR listing.status::text = $2)
    AND ($3::text IS NULL OR listing.offer_type::text = $3)
    AND (
      $4::uuid IS NULL
      OR EXISTS (
        SELECT 1
        FROM template_listing_categories listing_category
        WHERE listing_category.listing_id = listing.id
          AND listing_category.category_id = $4
      )
    )
`;

function filterValue<T extends string>(value: T, all: T): T | null {
  return value === all ? null : value;
}

@Injectable()
export class TypeOrmAdminTemplateReader implements AdminTemplateReader {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(): Promise<AdminTemplatesOverview> {
    const rows = await this.dataSource.query<OverviewRawRow[]>(
      `
        SELECT
          COUNT(*)::int AS "listings",
          COUNT(*) FILTER (WHERE status = 'PUBLISHED')::int AS "published",
          COUNT(*) FILTER (WHERE status = 'DRAFT')::int AS "draft",
          COUNT(*) FILTER (WHERE offer_type = 'PAID')::int AS "paid",
          COUNT(*) FILTER (WHERE offer_type = 'FREE')::int AS "free",
          (
            SELECT COALESCE(SUM(amount), 0)::text
            FROM template_purchases
            WHERE status = 'PAID'
          ) AS "grossSales"
        FROM template_listings
      `,
    );
    const row = rows[0];

    return {
      listings: Number(row?.listings ?? 0),
      published: Number(row?.published ?? 0),
      draft: Number(row?.draft ?? 0),
      paid: Number(row?.paid ?? 0),
      free: Number(row?.free ?? 0),
      grossSales: Number(row?.grossSales ?? 0),
      currency: 'VND',
    };
  }

  async listTemplates(
    input: ListAdminTemplatesInput,
  ): Promise<ListAdminTemplatesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;
    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;
    const filters = [
      input.search?.trim() || null,
      filterValue(input.status, AdminTemplateStatusFilter.ALL),
      filterValue(input.offerType, AdminTemplateOfferFilter.ALL),
      input.categoryId ?? null,
    ];

    const rows = await this.dataSource.query<TemplateRawRow[]>(
      `
        SELECT
          listing.id AS "listingId",
          template.id AS "templateId",
          template.name AS "templateName",
          template.cover_url AS "coverUrl",
          creator.id AS "creatorId",
          creator.email AS "creatorEmail",
          creator.username AS "creatorUsername",
          workspace.id AS "workspaceId",
          workspace.name AS "workspaceName",
          listing.status AS "status",
          listing.offer_type AS "offerType",
          listing.price_amount::text AS "priceAmount",
          listing.currency AS "currency",
          (
            SELECT COALESCE(
              json_agg(
                json_build_object('id', category.id, 'name', category.name)
                ORDER BY category.sort_order, category.name
              ),
              '[]'::json
            )
            FROM template_listing_categories listing_category
            INNER JOIN template_categories category
              ON category.id = listing_category.category_id
            WHERE listing_category.listing_id = listing.id
          ) AS "categories",
          (
            SELECT COUNT(*)::int
            FROM template_likes template_like
            WHERE template_like.template_id = template.id
          ) AS "likes",
          review_stats.reviews AS "reviews",
          review_stats.average_rating AS "averageRating",
          purchase_stats.paid_purchases AS "paidPurchases",
          purchase_stats.gross_sales AS "grossSales",
          listing.published_at AS "publishedAt",
          listing.updated_at AS "updatedAt"
        FROM (
          SELECT listing.id
          ${TEMPLATES_FROM}
          ORDER BY listing.published_at DESC NULLS LAST,
            listing.updated_at DESC,
            listing.id
          LIMIT $5
          OFFSET $6
        ) page_listing
        INNER JOIN template_listings listing ON listing.id = page_listing.id
        INNER JOIN page_templates template ON template.id = listing.template_id
        INNER JOIN users creator ON creator.id = listing.created_by
        INNER JOIN workspaces workspace ON workspace.id = template.workspace_id
        CROSS JOIN LATERAL (
          SELECT
            COUNT(*)::int AS reviews,
            ROUND(AVG(review.rating)::numeric, 2)::float AS average_rating
          FROM template_reviews review
          WHERE review.template_id = template.id
        ) review_stats
        CROSS JOIN LATERAL (
          SELECT
            COUNT(*)::int AS paid_purchases,
            COALESCE(SUM(purchase.amount), 0)::text AS gross_sales
          FROM template_purchases purchase
          WHERE purchase.template_id = template.id
            AND purchase.status = 'PAID'
        ) purchase_stats
        ORDER BY listing.published_at DESC NULLS LAST,
          listing.updated_at DESC,
          listing.id
      `,
      [...filters, limit, (page - 1) * limit],
    );

    const countRows = await this.dataSource.query<
      Array<{ total: number | string }>
    >(`SELECT COUNT(*) AS total ${TEMPLATES_FROM}`, filters);

    return {
      items: rows.map((row) => ({
        listingId: row.listingId,
        template: {
          id: row.templateId,
          name: row.templateName,
          coverUrl: row.coverUrl,
        },
        creator: {
          id: row.creatorId,
          email: row.creatorEmail,
          username: row.creatorUsername,
        },
        workspace: { id: row.workspaceId, name: row.workspaceName },
        status: row.status,
        offerType: row.offerType,
        priceAmount: Number(row.priceAmount),
        currency: row.currency,
        categories: row.categories,
        stats: {
          likes: Number(row.likes),
          reviews: Number(row.reviews),
          averageRating:
            row.averageRating === null ? null : Number(row.averageRating),
          paidPurchases: Number(row.paidPurchases),
          grossSales: Number(row.grossSales),
        },
        publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
        updatedAt: new Date(row.updatedAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }
}
