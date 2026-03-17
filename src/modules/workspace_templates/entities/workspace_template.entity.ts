import { Project } from 'src/modules/projects/entities/project.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity('workspace_templates')
@Index(['key'], { unique: true })
export class WorkspaceTemplate {
  @Column({ name: 'key', type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Project, (project) => project.template)
  projects: Project[];
}
