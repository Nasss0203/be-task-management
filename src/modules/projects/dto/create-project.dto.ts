import { ProjectVisibility } from '../domain/entities/project.entity';

export class CreateProjectDto {
  workspace_id: string;

  name: string;

  key: string;

  visibility?: ProjectVisibility;

  task_seq?: number;

  created_by: string;
}
