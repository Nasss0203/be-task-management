import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  AdminDashboardOverview,
  AdminDashboardReader,
} from '../../../../application/ports/admin-dashboard-reader.port';

interface AdminDashboardOverviewRawRow {
  totalUsers: number | string;
  activeUsers: number | string;
  inactiveUsers: number | string;
  totalWorkspaces: number | string;
  archivedWorkspaces: number | string;
  totalTeamspaces: number | string;
  totalPages: number | string;
  totalAttachments: number | string;
  storageBytes: number | string;
}

@Injectable()
export class TypeOrmAdminDashboardReader implements AdminDashboardReader {
  constructor(private readonly dataSource: DataSource) {}

  async getOverview(): Promise<AdminDashboardOverview> {
    const rows = await this.dataSource.query<AdminDashboardOverviewRawRow[]>(
      `
          SELECT
            (
              SELECT COUNT(*)::int
              FROM users
              WHERE deleted_at IS NULL
            ) AS "totalUsers",

            (
              SELECT COUNT(*)::int
              FROM users
              WHERE deleted_at IS NULL
                AND is_active = TRUE
            ) AS "activeUsers",

            (
              SELECT COUNT(*)::int
              FROM users
              WHERE deleted_at IS NULL
                AND is_active = FALSE
            ) AS "inactiveUsers",

            (
              SELECT COUNT(*)::int
              FROM workspaces
            ) AS "totalWorkspaces",

            (
              SELECT COUNT(*)::int
              FROM workspaces
              WHERE deleted_at IS NOT NULL
            ) AS "archivedWorkspaces",

            (
              SELECT COUNT(*)::int
              FROM teamspaces
              WHERE deleted_at IS NULL
            ) AS "totalTeamspaces",

            (
              SELECT COUNT(*)::int
              FROM pages
              WHERE deleted_at IS NULL
            ) AS "totalPages",

            (
              SELECT COUNT(*)::int
              FROM attachments
            ) AS "totalAttachments",

            (
              SELECT COALESCE(SUM(size), 0)
              FROM attachments
            ) AS "storageBytes"
        `,
    );

    const row = rows[0];

    return {
      totalUsers: Number(row?.totalUsers ?? 0),
      activeUsers: Number(row?.activeUsers ?? 0),
      inactiveUsers: Number(row?.inactiveUsers ?? 0),
      totalWorkspaces: Number(row?.totalWorkspaces ?? 0),
      archivedWorkspaces: Number(row?.archivedWorkspaces ?? 0),
      totalTeamspaces: Number(row?.totalTeamspaces ?? 0),
      totalPages: Number(row?.totalPages ?? 0),
      totalAttachments: Number(row?.totalAttachments ?? 0),
      storageBytes: Number(row?.storageBytes ?? 0),
    };
  }
}
