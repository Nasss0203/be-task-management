import { Board } from 'src/modules/boards/entities/board.entity';
import { Sprint } from 'src/modules/sprints/entities/sprint.entity';
import { Task } from 'src/modules/tasks/entities/task.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { WorkspaceTemplate } from 'src/modules/workspace_templates/entities/workspace_template.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

export enum ProjectVisibility {
  PRIVATE = 'PRIVATE',
  INTERNAL = 'INTERNAL',
}

@Entity('projects')
@Index(['workspaceId', 'key'], { unique: true })
@Index(['workspaceId'])
export class Project {
  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string | null;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'key', type: 'varchar', length: 50 })
  key: string;

  @Column({
    name: 'visibility',
    type: 'enum',
    enum: ProjectVisibility,
    default: ProjectVisibility.PRIVATE,
  })
  visibility: ProjectVisibility;

  @Column({ name: 'task_seq', type: 'int', default: 0 })
  taskSeq: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => WorkspaceTemplate, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'template_id' })
  template?: WorkspaceTemplate | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => Board, (board) => board.project)
  boards: Board[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task;
}
