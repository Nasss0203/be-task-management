import { AddWorkspaceMemberDto } from '../../dto/create-user_workspace.dto';
import { UserWorkspaceResponseDto } from '../../dto/response/user_workspace.response.dto';

export interface AddWorkspaceMemberApplication {
  addMember(
    workspaceId: string,
    dto: AddWorkspaceMemberDto,
    addedBy: string,
  ): Promise<UserWorkspaceResponseDto>;
}
