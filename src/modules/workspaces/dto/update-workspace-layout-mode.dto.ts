import { IsEnum } from 'class-validator';
import { WorkspaceLayoutMode } from '../domain/entities/workspace.entity';

export class UpdateWorkspaceLayoutModeDto {
  @IsEnum(WorkspaceLayoutMode)
  layoutMode: WorkspaceLayoutMode;
}
