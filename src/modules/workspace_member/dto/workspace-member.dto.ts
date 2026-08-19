import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

export class CreateWorkspaceMemberDto {
  id?: string;
  workspace_id: string;
  user_id: string;
  role_name?: WorkspaceRole;
  joinedAt?: Date;
  lastOpenedAt?: Date;
}

export class AddWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  role_name: WorkspaceRole;
}

export class UpdateWorkspaceMemberRoleDto {
  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  role_name: WorkspaceRole;
}
