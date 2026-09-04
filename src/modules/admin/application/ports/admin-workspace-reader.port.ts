import type { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';

export interface ListAdminWorkspacesInput {
  page: number;
  limit: number;
  search?: string;
}

export interface AdminWorkspaceOwnerSummary {
  id: string;
  email: string;
  username: string;
}

export interface AdminWorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  layoutMode: WorkspaceLayoutMode;
  owner: AdminWorkspaceOwnerSummary | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAdminWorkspacesResult {
  items: AdminWorkspaceSummary[];
  total: number;
  page: number;
  limit: number;
} 

export interface AdminWorkspaceDetail extends AdminWorkspaceSummary {
  createdBy: string | null;
  teamspaceCount: number;
}

export interface ListAdminWorkspaceMembersInput {
  workspaceId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface AdminWorkspaceMemberSummary {
  userId: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  roleName: 'OWNER' | 'MEMBER';
  isActive: boolean;
  joinedAt: Date;
  lastOpenedAt: Date | null;
}

export interface ListAdminWorkspaceMembersResult {
  items: AdminWorkspaceMemberSummary[];
  total: number;
  page: number;
  limit: number;
}  

export type AdminTeamspaceVisibility = 'OPEN' | 'CLOSED' | 'PRIVATE';

export interface ListAdminWorkspaceTeamspacesInput {
  workspaceId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface AdminWorkspaceTeamspaceSummary {
  id: string;
  workspaceId: string;
  name: string;
  visibility: AdminTeamspaceVisibility;
  createdBy: string | null;
  memberCount: number;
  pageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAdminWorkspaceTeamspacesResult {
  items: AdminWorkspaceTeamspaceSummary[];
  total: number;
  page: number;
  limit: number;
} 

export interface ListAdminWorkspacePagesInput {
  workspaceId: string;
  page: number;
  limit: number;
  search?: string;
  teamspaceId?: string;
}

export interface AdminWorkspacePageSummary {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAdminWorkspacePagesResult {
  items: AdminWorkspacePageSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminWorkspaceReader {
  listWorkspaces(
    input: ListAdminWorkspacesInput,
  ): Promise<ListAdminWorkspacesResult>;

  findWorkspaceById(workspaceId: string): Promise<AdminWorkspaceDetail | null>;

  listWorkspaceMembers(
    input: ListAdminWorkspaceMembersInput,
  ): Promise<ListAdminWorkspaceMembersResult>;

  listWorkspaceTeamspaces(
    input: ListAdminWorkspaceTeamspacesInput,
  ): Promise<ListAdminWorkspaceTeamspacesResult>;

  listWorkspacePages(
    input: ListAdminWorkspacePagesInput,
  ): Promise<ListAdminWorkspacePagesResult>;
}

