import { ProjectModel } from '../../domain/models/projects.model';

export interface FindProjectService {
  findAllByWorkspaceId(workspaceId: string): Promise<ProjectModel[]>;
}
