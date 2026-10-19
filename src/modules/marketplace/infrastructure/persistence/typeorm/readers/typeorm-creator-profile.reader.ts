import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  CreatorProfileReader,
  CreatorStats,
  PublicCreatorRecord,
} from '../../../../application/ports/creator-profile-reader.port';

const PUBLIC_TEMPLATE = `
  t.visibility = 'PUBLIC'
  AND t.status <> 'ARCHIVED'
  AND EXISTS (
    SELECT 1 FROM page_template_versions v
    WHERE v.template_id = t.id AND v.status = 'PUBLISHED'
  )
  AND EXISTS (
    SELECT 1 FROM template_listings l
    WHERE l.template_id = t.id AND l.status = 'PUBLISHED'
  )
`;

type CreatorRow = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  joined_at: Date;
  handle: string | null;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  website_url: string | null;
  x_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  avatar_key: string | null;
  cover_key: string | null;
};

@Injectable()
export class TypeOrmCreatorProfileReader implements CreatorProfileReader {
  constructor(private readonly dataSource: DataSource) {}

  async findPublicByHandle(
    handle: string,
  ): Promise<PublicCreatorRecord | null> {
    const normalized = handle.trim().toLowerCase();
    const rows: CreatorRow[] = await this.dataSource.query(
      `
      SELECT u.id AS user_id, u.username, u.avatar_url, u.created_at AS joined_at,
        cp.handle, cp.display_name, cp.headline, cp.bio,
        cp.website_url, cp.x_url, cp.github_url, cp.linkedin_url,
        cp.youtube_url, cp.facebook_url, cp.avatar_key, cp.cover_key
      FROM users u
      LEFT JOIN creator_profiles cp ON cp.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND (cp.handle = $1 OR (cp.user_id IS NULL AND lower(u.username) = $1))
      ORDER BY (cp.handle = $1) DESC NULLS LAST
      LIMIT 1
      `,
      [normalized],
    );

    const row = rows[0];
    if (!row) return null;

    return {
      userId: row.user_id,
      handle: row.handle ?? row.username.toLowerCase(),
      hasProfile: row.handle !== null,
      displayName: row.display_name,
      headline: row.headline,
      bio: row.bio,
      links: {
        website: row.website_url,
        x: row.x_url,
        github: row.github_url,
        linkedin: row.linkedin_url,
        youtube: row.youtube_url,
        facebook: row.facebook_url,
      },
      avatarKey: row.avatar_key,
      coverKey: row.cover_key,
      fallbackAvatarUrl: row.avatar_url,
      username: row.username,
      joinedAt: row.joined_at,
    };
  }

  async findAccount(
    userId: string,
  ): Promise<{ username: string; avatarUrl: string | null } | null> {
    const rows: { username: string; avatar_url: string | null }[] =
      await this.dataSource.query(
        'SELECT username, avatar_url FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId],
      );

    return rows[0]
      ? { username: rows[0].username, avatarUrl: rows[0].avatar_url }
      : null;
  }

  async getStats(userId: string): Promise<CreatorStats> {
    const rows: {
      template_count: number;
      rating_average: string | null;
      rating_count: number;
      like_count: number;
    }[] = await this.dataSource.query(
      `
      WITH t AS (
        SELECT t.id FROM page_templates t
        WHERE t.created_by = $1 AND ${PUBLIC_TEMPLATE}
      )
      SELECT
        (SELECT COUNT(*)::int FROM t) AS template_count,
        (SELECT ROUND(AVG(r.rating), 2)::text FROM template_reviews r
          WHERE r.template_id IN (SELECT id FROM t)) AS rating_average,
        (SELECT COUNT(*)::int FROM template_reviews r
          WHERE r.template_id IN (SELECT id FROM t)) AS rating_count,
        (SELECT COUNT(*)::int FROM template_likes l
          WHERE l.template_id IN (SELECT id FROM t)) AS like_count
      `,
      [userId],
    );

    const row = rows[0];

    return {
      templateCount: row?.template_count ?? 0,
      ratingAverage:
        row?.rating_average == null ? null : Number(row.rating_average),
      ratingCount: row?.rating_count ?? 0,
      likeCount: row?.like_count ?? 0,
    };
  }

  async isHandleTaken(handle: string, userId: string): Promise<boolean> {
    const rows: { taken: boolean }[] = await this.dataSource.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM creator_profiles WHERE handle = $1 AND user_id <> $2
      ) OR EXISTS (
        SELECT 1 FROM users WHERE lower(username) = $1 AND id <> $2
      ) AS taken
      `,
      [handle, userId],
    );

    return rows[0]?.taken ?? false;
  }
}
