import { CreateWorkspaceDto } from '../../dto/create-workspace.dto';
import { WorkspaceResponseDto } from '../../dto/response/workspaces.response.dto';
import { WorkspaceTemplateType } from '../../types/types';

export type CreateWorkspaceTemplateDto = CreateWorkspaceDto & {
  templateId?: string;
};

export interface CreateWorkspaceTemplateApplication {
  create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceTemplateDto;
  }): Promise<WorkspaceResponseDto>;
}
