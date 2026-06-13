import { SaveWorkspaceAsTemplateDto } from '../../dto/save-workspace-template.dto';

export interface SaveWorkspaceAsTemplateCommand {
  userId: string;
  workspaceId: string;
  dto: SaveWorkspaceAsTemplateDto;
}

export interface SaveWorkspaceAsTemplateApplication {
  save(command: SaveWorkspaceAsTemplateCommand): Promise<{
    workspaceTemplateId: string;
    pageTemplateId: string;
    name: string;
    visibility: string;
    configSummary: {
      projects: number;
      boards: number;
      statuses: number;
      priorities: number;
      sampleTasks: number;
      blocks: number;
    };
  }>;
}
