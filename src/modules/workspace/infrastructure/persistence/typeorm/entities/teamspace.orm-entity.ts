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

import { TeamspaceVisibility } from '../../../../domain/enums/teamspace-visibility.enum';
import { TeamspaceMemberOrmEntity } from './teamspace-member.orm-entity';
import { WorkspaceOrmEntity } from './workspace.orm-entity';

@Entity('teamspaces')
@Index('UQ_teamspaces_workspace_slug', ['workspaceId', 'slug'], {
  unique: true,
})
@Index('IDX_teamspaces_workspace_id', ['workspaceId'])
@Index('IDX_teamspaces_deleted_at', ['deletedAt'])
export class TeamspaceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'workspace_id',
    type: 'uuid',
  })
  workspaceId: string;

  @ManyToOne(() => WorkspaceOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'workspace_id',
  })
  workspace: WorkspaceOrmEntity;

  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 180,
  })
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  icon: string | null;

  @Column({
    type: 'enum',
    enum: TeamspaceVisibility,
    enumName: 'teamspaces_visibility_enum',
    default: TeamspaceVisibility.OPEN,
  })
  visibility: TeamspaceVisibility;

  @Column({
    name: 'created_by',
    type: 'uuid',
  })
  createdBy: string;

  @OneToMany(
    () => TeamspaceMemberOrmEntity,
    (teamspaceMember) => teamspaceMember.teamspace,
  )
  members: TeamspaceMemberOrmEntity[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null;

  @Column({
    name: 'deleted_by',
    type: 'uuid',
    nullable: true,
  })
  deletedBy: string | null;
}
