import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  AdminWorkspaceDetail,
  AdminWorkspaceMemberSummary,
  AdminWorkspaceReader,
  AdminWorkspaceSummary,
  AdminWorkspaceTeamspaceSummary,
  ListAdminWorkspaceMembersInput,
  ListAdminWorkspaceMembersResult,
  ListAdminWorkspacesInput,
  ListAdminWorkspacesResult,
  ListAdminWorkspaceTeamspacesInput,
  ListAdminWorkspaceTeamspacesResult,
  AdminWorkspacePageSummary,
  ListAdminWorkspacePagesInput,
  ListAdminWorkspacePagesResult,
} from '../../../../application/ports/admin-workspace-reader.port';

interface AdminWorkspaceRawRow {
  id: string;
  name: string;
  slug: string;
  layoutMode: AdminWorkspaceSummary['layoutMode'];
  ownerId: string | null;
  ownerEmail: string | null;
  ownerUsername: string | null;
  memberCount: number | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}  

interface AdminWorkspaceMemberRawRow {
  userId: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  roleName: AdminWorkspaceMemberSummary['roleName'];
  isActive: boolean;
  joinedAt: Date | string;
  lastOpenedAt: Date | string | null;
}

interface AdminWorkspaceDetailRawRow extends AdminWorkspaceRawRow {
  createdBy: string | null;
  teamspaceCount: number | string;
} 

interface AdminWorkspaceTeamspaceRawRow {
  id: string;
  workspaceId: string;
  name: string;
  visibility: AdminWorkspaceTeamspaceSummary['visibility'];
  createdBy: string | null;
  memberCount: number | string;
  pageCount: number | string;
  createdAt: Date | string;
  updatedAt: Date | string;
} 

interface AdminWorkspacePageRawRow {
  id: string;
  workspaceId: string;
  teamspaceId: string | null;
  parentPageId: string | null;
  title: string;
  slug: string | null;
  icon: string | null;
  coverUrl: string | null;
  isTemplate: boolean;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class TypeOrmAdminWorkspaceReader implements AdminWorkspaceReader {
  constructor(private readonly dataSource: DataSource) {}

  async findWorkspaceById(
    workspaceId: string,
  ): Promise<AdminWorkspaceDetail | null> {
    const rows = await this.dataSource.query<AdminWorkspaceDetailRawRow[]>(
      `
      SELECT
        w.id AS "id",
        w.name AS "name",
        w.slug AS "slug",
        w.layout_mode AS "layoutMode",
        w.created_by AS "createdBy",
        owner.id AS "ownerId",
        owner.email AS "ownerEmail",
        owner.username AS "ownerUsername",
        COALESCE(member_counts.member_count, 0) AS "memberCount",
        COALESCE(teamspace_counts.teamspace_count, 0) AS "teamspaceCount",
        w.created_at AS "createdAt",
        w.updated_at AS "updatedAt"
      FROM workspaces w
      LEFT JOIN LATERAL (
        SELECT
          u.id,
          u.email,
          u.username
        FROM workspace_members owner_member
        INNER JOIN users u
          ON u.id = owner_member.user_id
        WHERE owner_member.workspace_id = w.id
          AND owner_member.role_name = 'OWNER'
          AND u.deleted_at IS NULL
        ORDER BY owner_member.joined_at ASC
        LIMIT 1
      ) owner ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS member_count
        FROM workspace_members member
        WHERE member.workspace_id = w.id
      ) member_counts ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS teamspace_count
        FROM teamspaces teamspace
        WHERE teamspace.workspace_id = w.id
          AND teamspace.deleted_at IS NULL
      ) teamspace_counts ON TRUE
      WHERE w.id = $1
        AND w.deleted_at IS NULL
      LIMIT 1
    `,
      [workspaceId],
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      layoutMode: row.layoutMode,
      createdBy: row.createdBy,
      owner: row.ownerId
        ? {
            id: row.ownerId,
            email: row.ownerEmail ?? '',
            username: row.ownerUsername ?? '',
          }
        : null,
      memberCount: Number(row.memberCount),
      teamspaceCount: Number(row.teamspaceCount),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async listWorkspaces(
    input: ListAdminWorkspacesInput,
  ): Promise<ListAdminWorkspacesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<AdminWorkspaceRawRow[]>(
      `
        SELECT
          w.id AS "id",
          w.name AS "name",
          w.slug AS "slug",
          w.layout_mode AS "layoutMode",
          owner.id AS "ownerId",
          owner.email AS "ownerEmail",
          owner.username AS "ownerUsername",
          COALESCE(member_counts.member_count, 0) AS "memberCount",
          w.created_at AS "createdAt",
          w.updated_at AS "updatedAt"
        FROM workspaces w
        LEFT JOIN LATERAL (
          SELECT
            u.id,
            u.email,
            u.username
          FROM workspace_members owner_member
          INNER JOIN users u
            ON u.id = owner_member.user_id
          WHERE owner_member.workspace_id = w.id
            AND owner_member.role_name = 'OWNER'
            AND u.deleted_at IS NULL
          ORDER BY owner_member.joined_at ASC
          LIMIT 1
        ) owner ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS member_count
          FROM workspace_members member
          WHERE member.workspace_id = w.id
        ) member_counts ON TRUE
        WHERE w.deleted_at IS NULL
          AND (
            $1::text IS NULL
            OR w.name ILIKE '%' || $1 || '%'
            OR w.slug ILIKE '%' || $1 || '%'
          )
        ORDER BY w.created_at DESC
        LIMIT $2
        OFFSET $3
      `,
      [search, limit, offset],
    );

    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `
        SELECT COUNT(*) AS total
        FROM workspaces w
        WHERE w.deleted_at IS NULL
          AND (
            $1::text IS NULL
            OR w.name ILIKE '%' || $1 || '%'
            OR w.slug ILIKE '%' || $1 || '%'
          )
      `,
      [search],
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        layoutMode: row.layoutMode,
        owner: row.ownerId
          ? {
              id: row.ownerId,
              email: row.ownerEmail ?? '',
              username: row.ownerUsername ?? '',
            }
          : null,
        memberCount: Number(row.memberCount),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async listWorkspaceMembers(
    input: ListAdminWorkspaceMembersInput,
  ): Promise<ListAdminWorkspaceMembersResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<AdminWorkspaceMemberRawRow[]>(
      `
        SELECT
          u.id AS "userId",
          u.email AS "email",
          u.username AS "username",
          u.avatar_url AS "avatarUrl",
          member.role_name AS "roleName",
          u.is_active AS "isActive",
          member.joined_at AS "joinedAt",
          member.last_opened_at AS "lastOpenedAt"
        FROM workspace_members member
        INNER JOIN users u
          ON u.id = member.user_id
        WHERE member.workspace_id = $1
          AND u.deleted_at IS NULL
          AND (
            $2::text IS NULL
            OR u.email ILIKE '%' || $2 || '%'
            OR u.username ILIKE '%' || $2 || '%'
          )
        ORDER BY
          CASE WHEN member.role_name = 'OWNER' THEN 0 ELSE 1 END,
          member.joined_at ASC
        LIMIT $3
        OFFSET $4
      `,
      [input.workspaceId, search, limit, offset],
    );

    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `
      SELECT COUNT(*) AS total
      FROM workspace_members member
      INNER JOIN users u
        ON u.id = member.user_id
      WHERE member.workspace_id = $1
        AND u.deleted_at IS NULL
        AND (
          $2::text IS NULL
          OR u.email ILIKE '%' || $2 || '%'
          OR u.username ILIKE '%' || $2 || '%'
        )
    `,
      [input.workspaceId, search],
    );

    return {
      items: rows.map((row) => ({
        userId: row.userId,
        email: row.email,
        username: row.username,
        avatarUrl: row.avatarUrl,
        roleName: row.roleName,
        isActive: row.isActive,
        joinedAt: new Date(row.joinedAt),
        lastOpenedAt: row.lastOpenedAt ? new Date(row.lastOpenedAt) : null,
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async listWorkspaceTeamspaces(
    input: ListAdminWorkspaceTeamspacesInput,
  ): Promise<ListAdminWorkspaceTeamspacesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<AdminWorkspaceTeamspaceRawRow[]>(
      `
        SELECT
          teamspace.id AS "id",
          teamspace.workspace_id AS "workspaceId",
          teamspace.name AS "name",
          teamspace.visibility AS "visibility",
          teamspace.created_by AS "createdBy",
          COALESCE(member_counts.member_count, 0) AS "memberCount",
          COALESCE(page_counts.page_count, 0) AS "pageCount",
          teamspace.created_at AS "createdAt",
          teamspace.updated_at AS "updatedAt"
        FROM teamspaces teamspace
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS member_count
          FROM teamspace_members teamspace_member
          INNER JOIN workspace_members workspace_member
            ON workspace_member.id =
              teamspace_member.workspace_member_id
          WHERE teamspace_member.teamspace_id = teamspace.id
        ) member_counts ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS page_count
          FROM pages page_item
          WHERE page_item.teamspace_id = teamspace.id
            AND page_item.deleted_at IS NULL
        ) page_counts ON TRUE
        WHERE teamspace.workspace_id = $1
          AND teamspace.deleted_at IS NULL
          AND (
            $2::text IS NULL
            OR teamspace.name ILIKE '%' || $2 || '%'
          )
        ORDER BY teamspace.created_at DESC
        LIMIT $3
        OFFSET $4
      `,
      [input.workspaceId, search, limit, offset],
    );

    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `
      SELECT COUNT(*) AS total
      FROM teamspaces teamspace
      WHERE teamspace.workspace_id = $1
        AND teamspace.deleted_at IS NULL
        AND (
          $2::text IS NULL
          OR teamspace.name ILIKE '%' || $2 || '%'
        )
    `,
      [input.workspaceId, search],
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        workspaceId: row.workspaceId,
        name: row.name,
        visibility: row.visibility,
        createdBy: row.createdBy,
        memberCount: Number(row.memberCount),
        pageCount: Number(row.pageCount),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }

  async listWorkspacePages(
    input: ListAdminWorkspacePagesInput,
  ): Promise<ListAdminWorkspacePagesResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim() || null;
    const teamspaceId = input.teamspaceId ?? null;
    const offset = (page - 1) * limit;

    const rows = await this.dataSource.query<AdminWorkspacePageRawRow[]>(
      `
        SELECT
          page_item.id AS "id",
          page_item.workspace_id AS "workspaceId",
          page_item.teamspace_id AS "teamspaceId",
          page_item.parent_page_id AS "parentPageId",
          page_item.title AS "title",
          page_item.slug AS "slug",
          page_item.icon AS "icon",
          page_item.cover_url AS "coverUrl",
          page_item.is_template AS "isTemplate",
          page_item.created_by AS "createdBy",
          page_item.created_at AS "createdAt",
          page_item.updated_at AS "updatedAt"
        FROM pages page_item
        WHERE page_item.workspace_id = $1
          AND page_item.deleted_at IS NULL
          AND (
            $2::text IS NULL
            OR page_item.title ILIKE '%' || $2 || '%'
            OR COALESCE(page_item.slug, '') ILIKE '%' || $2 || '%'
          )
          AND (
            $3::uuid IS NULL
            OR page_item.teamspace_id = $3::uuid
          )
        ORDER BY page_item.created_at DESC
        LIMIT $4
        OFFSET $5
      `,
      [input.workspaceId, search, teamspaceId, limit, offset],
    );

    const countRows = await this.dataSource.query<Array<{ total: string }>>(
      `
      SELECT COUNT(*) AS total
      FROM pages page_item
      WHERE page_item.workspace_id = $1
        AND page_item.deleted_at IS NULL
        AND (
          $2::text IS NULL
          OR page_item.title ILIKE '%' || $2 || '%'
          OR COALESCE(page_item.slug, '') ILIKE '%' || $2 || '%'
        )
        AND (
          $3::uuid IS NULL
          OR page_item.teamspace_id = $3::uuid
        )
    `,
      [input.workspaceId, search, teamspaceId],
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        workspaceId: row.workspaceId,
        teamspaceId: row.teamspaceId,
        parentPageId: row.parentPageId,
        title: row.title,
        slug: row.slug,
        icon: row.icon,
        coverUrl: row.coverUrl,
        isTemplate: row.isTemplate,
        createdBy: row.createdBy,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })),
      total: Number(countRows[0]?.total ?? 0),
      page,
      limit,
    };
  }
}
