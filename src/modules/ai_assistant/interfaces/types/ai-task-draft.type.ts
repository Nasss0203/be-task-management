export type AiTaskDraftPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface AiTaskDraftSubtask {
  title: string;
  description: string;
  estimatedHours: number;
}

export interface AiTaskDraftItem {
  title: string;
  description: string;
  priority: AiTaskDraftPriority;
  estimatedHours: number;
  subtasks: AiTaskDraftSubtask[];
  acceptanceCriteria: string[];
  risks: string[];
}

export interface AiTaskDraft {
  tasks: AiTaskDraftItem[];
}

