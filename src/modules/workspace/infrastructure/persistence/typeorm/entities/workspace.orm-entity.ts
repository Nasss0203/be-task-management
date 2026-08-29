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
import { WorkspaceLayoutMode } from '../../../../domain/enums/workspace-layout-mode.enum';
import { TeamspaceOrmEntity } from './teamspace.orm-entity';
import { WorkspaceMemberOrmEntity } from './workspace-member.orm-entity';

@Entity('workspaces')
@Index('IDX_WORKSPACES_DELETED_AT', ['deletedAt'])
export class WorkspaceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: WorkspaceLayoutMode,
    default: WorkspaceLayoutMode.TABS,
    name: 'layout_mode',
  })
  layoutMode: WorkspaceLayoutMode;

  @OneToMany(
    () => WorkspaceMemberOrmEntity,
    (workspaceMember) => workspaceMember.workspace,
  )
  workspaceMembers: WorkspaceMemberOrmEntity[];

  @OneToMany(() => TeamspaceOrmEntity, (teamspace) => teamspace.workspace)
  teamspaces: TeamspaceOrmEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;
}
