import { MemberWorkspaceResponseDto } from '../../dto/response/user_workspace.response.dto';

export interface FindAllMemberApplication {
  findAllMember(workspaceId: string): Promise<MemberWorkspaceResponseDto[]>;
}
