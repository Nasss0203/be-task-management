import { WorkspaceMemberModel } from '../../domain/models/workspace-member.model';
import { CreateWorkspaceMemberDto } from '../../dto/create-workspace_member.dto';

export interface CreateWorkspaceMemberService {
  create(
    createWorkspaceMemberDto: CreateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberModel>;
}
