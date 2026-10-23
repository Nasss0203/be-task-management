import { User } from 'src/modules/identity/identity.types';
import { Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TeamspaceOrmEntity } from './teamspace.orm-entity';

@Entity('teamspace_invite_links')
@Index('UQ_teamspace_invite_links_token_hash', ['tokenHash'], { unique: true })
@Index('IDX_teamspace_invite_links_teamspace_created', ['teamspaceId', 'createdAt'])
@Check('CHK_teamspace_invite_links_use_count', '"use_count" >= 0')
@Check('CHK_teamspace_invite_links_max_uses', '"max_uses" IS NULL OR "max_uses" > 0')
@Check('CHK_teamspace_invite_links_limit', '"max_uses" IS NULL OR "use_count" <= "max_uses"')
export class TeamspaceInviteLinkOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'teamspace_id', type: 'uuid' })
  teamspaceId: string;

  @ManyToOne(() => TeamspaceOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamspace_id', foreignKeyConstraintName: 'FK_teamspace_invite_links_teamspace' })
  teamspace: TeamspaceOrmEntity;

  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by', foreignKeyConstraintName: 'FK_teamspace_invite_links_creator' })
  creator: User | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ name: 'use_count', type: 'int', default: 0 })
  useCount: number;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
