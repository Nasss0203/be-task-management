import { AiProjectDraftVisibility } from './ai-project-draft.type';
import { AiTaskDraftPriority } from './ai-task-draft.type';

export interface AiWorkspaceTreeDraftTask {
  title: string;
  description: string;
  priority: AiTaskDraftPriority;
  estimatedHours: number;
}

export interface AiWorkspaceTreeDraftProject {
  name: string;
  key: string;
  visibility: AiProjectDraftVisibility;
  description: string;
  tasks: AiWorkspaceTreeDraftTask[];
}

export interface AiWorkspaceTreeDraftWorkspace {
  name: string;
  slug: string;
  projects: AiWorkspaceTreeDraftProject[];
}

export interface AiWorkspaceTreeDraft {
  workspaces: AiWorkspaceTreeDraftWorkspace[];
}
