import { CreateWorkspaceMemberDto } from '../../dto/create-workspace_member.dto';
import { WorkspaceMemberResponseDto } from '../../dto/response/workspace-member.response.dto';

export interface CreateWorkspaceMemberApplication {
  create(
    createWorkspaceMemberDto: CreateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberResponseDto>;
}
