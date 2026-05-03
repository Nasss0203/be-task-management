import { Board } from 'src/modules/boards/domain/entities/board.entity';
import { Sprint } from 'src/modules/sprints/domain/entities/sprint.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProjectVisibility {
  PRIVATE = 'PRIVATE',
  INTERNAL = 'INTERNAL',
}

@Entity('projects')
@Index('UQ_PROJECTS_WORKSPACE_KEY_ACTIVE', ['workspace_id', 'key'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('IDX_PROJECTS_WORKSPACE_ID', ['workspace_id'])
@Index('IDX_PROJECTS_DELETED_AT', ['deleted_at'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspace_id: string;

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
  task_seq: number;

  @Column({ name: 'created_by', type: 'uuid' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @ManyToOne(() => Workspace, (workspace) => workspace.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => Board, (board) => board.project)
  boards: Board[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];
}
