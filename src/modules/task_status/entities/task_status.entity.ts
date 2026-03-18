import { Board } from 'src/modules/boards/entities/board.entity';
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

@Entity('task_statuses')
@Index(['projectId', 'name'], { unique: true })
@Index(['boardId', 'position'])
export class TaskStatus {
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'board_id', type: 'uuid' })
  boardId: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'position', type: 'int', default: 0 })
  position: number;

  @Column({ name: 'color', type: 'varchar', length: 30, nullable: true })
  color?: string | null;

  @Column({ name: 'is_done', type: 'boolean', default: false })
  isDone: boolean;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Board, (board) => board.statuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'board_id' })
  board: Board;

  @OneToMany(() => Task, (task) => task.status)
  tasks: Task[];
}
