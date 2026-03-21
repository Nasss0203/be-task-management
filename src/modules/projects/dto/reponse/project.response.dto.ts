import { ProjectVisibility } from '../../domain/entities/project.entity';

export class ProjectResponseDto {
  id: string;

  workspace_id: string;

  name: string;

  key: string;

  visibility: ProjectVisibility;

  task_seq: number;

  created_by: string;

  created_at: Date;

  updated_at: Date;
}
