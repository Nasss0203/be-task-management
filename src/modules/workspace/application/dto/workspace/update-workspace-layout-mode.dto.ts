import { IsEnum } from 'class-validator';
import { WorkspaceLayoutMode } from 'src/modules/workspace/domain/enums/workspace-layout-mode.enum';

export class UpdateWorkspaceLayoutModeDto {
  @IsEnum(WorkspaceLayoutMode)
  layoutMode: WorkspaceLayoutMode;
}
