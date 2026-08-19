import { EntityManager } from 'typeorm';

export interface DeleteWorkspaceMemberInput {
  workspace_id: string;
  user_id: string;
  actor_id: string;
}

export interface DeleteWorkspaceMemberService {
  deleteMember(
    input: DeleteWorkspaceMemberInput,
    manager?: EntityManager,
  ): Promise<void>;
}
