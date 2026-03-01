import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum RoleName {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}
@Index('UQ_role_workspace_name', ['workspace_id', 'name'], { unique: true })
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RoleName })
  name: RoleName;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @ManyToOne(() => Workspace, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: Workspace | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
