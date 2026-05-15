import { Project } from 'src/modules/projects/domain/entities/project.entity';
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

export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
@Entity('sprints')
@Index(['workspaceId'])
@Index(['projectId'])
@Index(['workspaceId', 'projectId'])
@Index('IDX_SPRINTS_DELETED_AT', ['deletedAt'])
@Index('UQ_SPRINTS_PROJECT_NAME_ACTIVE', ['projectId', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'goal', type: 'varchar', length: 500, nullable: true })
  goal: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SprintStatus,
    default: SprintStatus.PLANNED,
  })
  status: SprintStatus;

  @Column({ name: 'start_at', type: 'timestamp', nullable: true })
  startAt: Date | null;

  @Column({ name: 'end_at', type: 'timestamp', nullable: true })
  endAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Project, (project) => project.sprints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Task, (task) => task.sprint)
  tasks: Task[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
