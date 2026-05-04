import { ProjectVisibility } from '../entities/project.entity';

export class ProjectModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly name: string,
    public readonly key: string,
    public readonly visibility: ProjectVisibility,
    public readonly task_seq: number,
    public readonly created_by: string,
    public readonly created_at: Date,
    public readonly updated_at: Date,

    public readonly deleted_at: Date | null = null,
    public readonly deleted_by: string | null = null,
  ) {}
}
