import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type {
  TemplateFeedbackReader,
  TemplateFeedbackSummary,
  TemplateFeedbackViewer,
  TemplateReviewListItem,
} from '../../../../application/ports/template-feedback-reader.port';

@Injectable()
export class TypeOrmTemplateFeedbackReader implements TemplateFeedbackReader {
  constructor(private readonly dataSource: DataSource) {}

  private manager(context?: PersistenceContext): EntityManager {
    return context instanceof EntityManager ? context : this.dataSource.manager;
  }

  async getSummaries(
    templateIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, TemplateFeedbackSummary>> {
    const ids = [...new Set(templateIds)];
    if (ids.length === 0) return new Map();

    const rows: {
      template_id: string;
      rating_average: string | null;
      rating_count: number;
      like_count: number;
    }[] = await this.manager(context).query(
      `
      SELECT t.id AS template_id,
        r.rating_average::text AS rating_average,
        COALESCE(r.rating_count, 0)::int AS rating_count,
        COALESCE(l.like_count, 0)::int AS like_count
      FROM unnest($1::uuid[]) AS t(id)
      LEFT JOIN (
        SELECT template_id, ROUND(AVG(rating), 2) AS rating_average, COUNT(*) AS rating_count
        FROM template_reviews
        WHERE template_id = ANY($1::uuid[])
        GROUP BY template_id
      ) r ON r.template_id = t.id
      LEFT JOIN (
        SELECT template_id, COUNT(*) AS like_count
        FROM template_likes
        WHERE template_id = ANY($1::uuid[])
        GROUP BY template_id
      ) l ON l.template_id = t.id
      `,
      [ids],
    );

    return new Map(
      rows.map((row) => [
        row.template_id,
        {
          ratingAverage:
            row.rating_average === null ? null : Number(row.rating_average),
          ratingCount: row.rating_count,
          likeCount: row.like_count,
        },
      ]),
    );
  }

  async getRatingDistribution(templateId: string): Promise<number[]> {
    const rows: { rating: number; count: number }[] =
      await this.dataSource.query(
        `
        SELECT rating::int AS rating, COUNT(*)::int AS count
        FROM template_reviews
        WHERE template_id = $1
        GROUP BY rating
        `,
        [templateId],
      );

    const distribution = [0, 0, 0, 0, 0];
    for (const row of rows) distribution[row.rating - 1] = row.count;

    return distribution;
  }

  async listReviews(
    templateId: string,
    page: number,
    limit: number,
  ): Promise<{ items: TemplateReviewListItem[]; total: number }> {
    const rows: {
      id: string;
      rating: number;
      body: string | null;
      version_number: number | null;
      is_owner: boolean;
      username: string | null;
      avatar_url: string | null;
      created_at: Date;
      updated_at: Date;
      total: number;
    }[] = await this.dataSource.query(
      `
      SELECT r.id, r.rating::int AS rating, r.body, v.version_number,
        EXISTS (
          SELECT 1 FROM template_entitlements e
          WHERE e.template_id = r.template_id AND e.user_id = r.user_id
        ) AS is_owner,
        u.username, u.avatar_url, r.created_at, r.updated_at,
        COUNT(*) OVER ()::int AS total
      FROM template_reviews r
      LEFT JOIN page_template_versions v ON v.id = r.version_id
      LEFT JOIN users u ON u.id = r.user_id AND u.deleted_at IS NULL
      WHERE r.template_id = $1
      ORDER BY (r.body IS NOT NULL) DESC, r.updated_at DESC, r.id
      LIMIT $2 OFFSET $3
      `,
      [templateId, limit, (page - 1) * limit],
    );

    let total = rows[0]?.total ?? 0;

    if (rows.length === 0 && page > 1) {
      const countRows: { total: number }[] = await this.dataSource.query(
        'SELECT COUNT(*)::int AS total FROM template_reviews WHERE template_id = $1',
        [templateId],
      );
      total = countRows[0]?.total ?? 0;
    }

    return {
      items: rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        body: row.body,
        versionNumber: row.version_number,
        isOwner: row.is_owner,
        author: row.username
          ? { username: row.username, avatarUrl: row.avatar_url }
          : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total,
    };
  }

  async getViewer(
    templateId: string,
    userId: string,
  ): Promise<TemplateFeedbackViewer> {
    const rows: {
      liked: boolean;
      rating: number | null;
      body: string | null;
      is_owner: boolean;
    }[] = await this.dataSource.query(
      `
      SELECT
        EXISTS (
          SELECT 1 FROM template_likes l
          WHERE l.template_id = $1 AND l.user_id = $2
        ) AS liked,
        (SELECT r.rating::int FROM template_reviews r
          WHERE r.template_id = $1 AND r.user_id = $2) AS rating,
        (SELECT r.body FROM template_reviews r
          WHERE r.template_id = $1 AND r.user_id = $2) AS body,
        EXISTS (
          SELECT 1 FROM template_entitlements e
          WHERE e.template_id = $1 AND e.user_id = $2
        ) AS is_owner
      `,
      [templateId, userId],
    );

    const row = rows[0];

    return {
      liked: row?.liked ?? false,
      review:
        row && row.rating !== null
          ? { rating: row.rating, body: row.body }
          : null,
      isOwner: row?.is_owner ?? false,
    };
  }

  async hasEntitlement(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const rows: { exists: boolean }[] = await this.manager(context).query(
      `SELECT EXISTS (
        SELECT 1 FROM template_entitlements
        WHERE template_id = $1 AND user_id = $2
      ) AS exists`,
      [templateId, userId],
    );

    return rows[0]?.exists ?? false;
  }
}
