import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('task_statuses')
@Index(['projectId', 'name'], { unique: true })
export class TaskStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'position', type: 'int', default: 0 })
  position: number;

  @Column({ name: 'color', type: 'varchar', length: 30, nullable: true })
  color?: string | null;

  @Column({ name: 'is_done', type: 'boolean', default: false })
  isDone: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Task, (task) => task.status)
  tasks: Task[];
}
