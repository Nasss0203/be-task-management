import { Board } from 'src/modules/boards/entities/board.entity';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { Sprint } from 'src/modules/sprints/entities/sprint.entity';
import { TaskPriority } from 'src/modules/task_priority/entities/task_priority.entity';
import { TaskStatus } from 'src/modules/task_status/entities/task_status.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tasks')
@Index(['projectId', 'projectSeq'], { unique: true })
@Index(['workspaceId'])
@Index(['projectId'])
@Index(['boardId'])
@Index(['statusId'])
@Index(['reporterId'])
@Index(['sprintId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'board_id', type: 'uuid' })
  boardId: string;

  @Column({ name: 'sprint_id', type: 'uuid', nullable: true })
  sprintId?: string | null;

  @Column({ name: 'project_seq', type: 'int' })
  projectSeq: number;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'status_id', type: 'uuid' })
  statusId: string;

  @Column({ name: 'priority_id', type: 'uuid', nullable: true })
  priorityId?: string | null;

  @Column({ name: 'reporter_id', type: 'uuid' })
  reporterId: string;

  @Column({ name: 'due_at', type: 'timestamp', nullable: true })
  dueAt?: Date | null;

  @Column({ name: 'estimate_minutes', type: 'int', nullable: true })
  estimateMinutes?: number | null;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Board, (board) => board.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sprint_id' })
  sprint?: Sprint | null;

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
  priority?: TaskPriority | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;
}
