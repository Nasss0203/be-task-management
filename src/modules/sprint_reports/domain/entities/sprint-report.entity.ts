import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { Sprint } from 'src/modules/sprints/domain/entities/sprint.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sprint_reports')
@Index(['workspaceId'])
@Index(['projectId'])
@Index(['sprintId'])
@Index('UQ_SPRINT_REPORTS_SPRINT_ID', ['sprintId'], { unique: true })
export class SprintReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'sprint_id', type: 'uuid' })
  sprintId: string;

  @Column({ name: 'sprint_name', type: 'varchar', length: 255 })
  sprintName: string;

  @Column({ name: 'sprint_goal', type: 'varchar', length: 500, nullable: true })
  sprintGoal: string | null;

  @Column({ name: 'total_tasks', type: 'int', default: 0 })
  totalTasks: number;

  @Column({ name: 'completed_tasks', type: 'int', default: 0 })
  completedTasks: number;

  @Column({ name: 'incomplete_tasks', type: 'int', default: 0 })
  incompleteTasks: number;

  @Column({ name: 'total_estimate', type: 'int', default: 0 })
  totalEstimate: number;

  @Column({ name: 'completed_estimate', type: 'int', default: 0 })
  completedEstimate: number;

  @Column({ name: 'completed_task_ids', type: 'jsonb', default: [] })
  completedTaskIds: string[];

  @Column({ name: 'incomplete_task_ids', type: 'jsonb', default: [] })
  incompleteTaskIds: string[];

  @Column({ name: 'member_performance', type: 'jsonb', default: [] })
  memberPerformance: Record<string, any>[];

  @Column({ name: 'completed_task_details', type: 'jsonb', default: [] })
  completedTaskDetails: Record<string, any>[];

  @Column({ name: 'incomplete_task_details', type: 'jsonb', default: [] })
  incompleteTaskDetails: Record<string, any>[];

  @Column({ name: 'start_at', type: 'timestamp', nullable: true })
  startAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Sprint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
