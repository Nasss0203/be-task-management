import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';
import { AdminWorkspaceOwnerResponseDto } from './admin-workspace-list.response.dto';

export class AdminWorkspaceDetailResponseDto {
  id: string;
  name: string;
  slug: string;
  layoutMode: WorkspaceLayoutMode;
  createdBy: string | null;
  owner: AdminWorkspaceOwnerResponseDto | null;
  memberCount: number;
  teamspaceCount: number;
  createdAt: Date;
  updatedAt: Date;
}
