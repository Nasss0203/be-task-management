import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';

export enum WorkspaceTemplateType {
  BLANK_PAGE = 'BLANK_PAGE',
  BLANK_DATABASE = 'BLANK_DATABASE',
  TASK_TRACKER = 'TASK_TRACKER',
  PROJECT = 'PROJECT',
}

export type TemplateProjectConfig = {
  templateKey: string;
  name: string;
  key: string;
};

export type TemplateBoardConfig = {
  templateKey: string;
  projectTemplateKey: string;
  name: string;
  viewType: BoardViewType;
};

export type TemplatePageBlockConfig = {
  templateKey: string;
  boardTemplateKey: string;
  title: string;
};

export type TemplateTaskStatusConfig = {
  projectTemplateKey: string;
  name: string;
  position?: number;
  color?: string | null;
};

export type TemplateTaskPriorityConfig = {
  projectTemplateKey: string;
  name: string;
  level?: number;
  color?: string | null;
};

export type TemplateTaskConfig = {
  projectTemplateKey: string;
  title: string;
  description?: string | null;
  statusName: string;
  priorityName?: string;
  estimateMinutes?: number;
};

export type WorkspaceTemplateConfig = {
  projects: TemplateProjectConfig[];
  boards: TemplateBoardConfig[];
  pageBlocks: TemplatePageBlockConfig[];
  statuses: TemplateTaskStatusConfig[];
  priorities: TemplateTaskPriorityConfig[];
  tasks: TemplateTaskConfig[];
};
