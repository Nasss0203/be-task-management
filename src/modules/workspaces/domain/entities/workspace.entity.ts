import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanTypeWorkspace {
  FREE = 'free',
  PRO = 'pro',
}

@Entity('workspaces')
@Index('IDX_WORKSPACES_DELETED_AT', ['deletedAt'])
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: PlanTypeWorkspace,
    default: PlanTypeWorkspace.FREE,
    name: 'plan_type',
  })
  planType: PlanTypeWorkspace;

  @OneToMany(() => Project, (project) => project.workspace)
  projects: Project[];

  @OneToMany(() => UserWorkspace, (userWorkspace) => userWorkspace.workspace)
  userWorkspaces: UserWorkspace[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;
}
