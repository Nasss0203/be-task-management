import { WorkspaceTemplate } from '../../domain/entities/workspace_template.entity';
import { FindOptionsWhere } from 'typeorm';

export interface WorkspaceTemplatesService {
  findAll(where?: FindOptionsWhere<WorkspaceTemplate>): Promise<WorkspaceTemplate[]>;
  findOne(id: string): Promise<WorkspaceTemplate>;
}
