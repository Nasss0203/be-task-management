import { Project } from 'src/modules/projects/entities/project.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity('sprints')
@Index(['workspaceId'])
@Index(['projectId'])
export class Sprint {
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'goal', type: 'varchar', length: 500, nullable: true })
  goal?: string | null;

  @Column({ name: 'start_at', type: 'timestamp', nullable: true })
  startAt?: Date | null;

  @Column({ name: 'end_at', type: 'timestamp', nullable: true })
  endAt?: Date | null;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, (project) => project.sprints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Task, (task) => task.sprint)
  tasks: Task[];
}
