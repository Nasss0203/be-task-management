import { Project } from 'src/modules/projects/domain/entities/project.entity';
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
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BoardViewType {
  BOARD = 'BOARD',
  TABLE = 'TABLE',
  LIST = 'LIST',
  CALENDAR = 'CALENDAR',
  TIMELINE = 'TIMELINE',
  GALLERY = 'GALLERY',
  CHART = 'CHART',
  DASHBOARD = 'DASHBOARD',
  FORM = 'FORM',
  MAP = 'MAP',
  FEED = 'FEED',
  BACKLOG = 'BACKLOG',
}

@Entity('boards')
@Index('IDX_BOARDS_WORKSPACE_ID', ['workspaceId'])
@Index('IDX_BOARDS_PROJECT_ID', ['projectId'])
@Index('IDX_BOARDS_DELETED_AT', ['deletedAt'])
@Index('UQ_BOARDS_PROJECT_NAME_ACTIVE', ['projectId', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({
    name: 'view_type',
    type: 'enum',
    enum: BoardViewType,
    default: BoardViewType.BOARD,
  })
  viewType: BoardViewType;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, (project) => project.boards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User | null;
}
