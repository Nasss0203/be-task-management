import { AiWorkspaceTreeDraftTask } from './ai-workspace-tree-draft.type';

export type AiProjectDraftVisibility = 'PRIVATE' | 'INTERNAL';

export interface AiProjectDraft {
  name: string;
  key: string;
  visibility: AiProjectDraftVisibility;
  description: string;
  tasks?: AiWorkspaceTreeDraftTask[];
}
