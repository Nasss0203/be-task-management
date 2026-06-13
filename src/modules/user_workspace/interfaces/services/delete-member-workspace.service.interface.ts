import { EntityManager } from 'typeorm';

export interface DeleteMemberWorkspaceInput {
  workspace_id: string;
  user_id: string;
  actor_id: string;
}

export interface DeleteMemberWorkspaceService {
  deleteMember(
    input: DeleteMemberWorkspaceInput,
    manager?: EntityManager,
  ): Promise<void>;
}
