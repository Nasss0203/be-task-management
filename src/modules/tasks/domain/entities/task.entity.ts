import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { Sprint } from 'src/modules/sprints/entities/sprint.entity';
import { TaskPriority } from 'src/modules/task_priority/domain/entities/task_priority.entity';
import { TaskStatus } from 'src/modules/task_status/domain/entities/task_status.entity';

import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tasks')
@Index('UQ_TASKS_PROJECT_SEQ', ['projectId', 'projectSeq'], { unique: true })
@Index('IDX_TASKS_WORKSPACE_ID', ['workspaceId'])
@Index('IDX_TASKS_PROJECT_ID', ['projectId'])
@Index('IDX_TASKS_STATUS_ID', ['statusId'])
@Index('IDX_TASKS_PRIORITY_ID', ['priorityId'])
@Index('IDX_TASKS_CREATED_BY', ['createdBy'])
@Index('IDX_TASKS_ASSIGNEE_ID', ['assigneeId'])
@Index('IDX_TASKS_SPRINT_ID', ['sprintId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'sprint_id', type: 'uuid', nullable: true })
  sprintId: string | null;

  @Column({ name: 'project_seq', type: 'int', nullable: true })
  projectSeq: number | null;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'status_id', type: 'uuid' })
  statusId: string;

  @Column({ name: 'priority_id', type: 'uuid', nullable: true })
  priorityId: string | null;

  @Column({ name: 'reporter_id', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'assignee_id', type: 'uuid', nullable: true })
  assigneeId: string | null;

  @Column({ name: 'start_at', type: 'timestamp', nullable: true })
  startAt: Date | null;

  @Column({ name: 'due_at', type: 'timestamp', nullable: true })
  dueAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'estimate_minutes', type: 'int', nullable: true })
  estimateMinutes: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint | null;

  @ManyToOne(() => TaskStatus, (status) => status.tasks, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'status_id' })
  status: TaskStatus;

  @ManyToOne(() => TaskPriority, (priority) => priority.tasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'priority_id' })
  priority: TaskPriority | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;
}
