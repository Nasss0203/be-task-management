import { UserAuthProvider } from 'src/modules/identity/domain/enums/user-auth-provider.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.orm-entity';

@Entity('user_auth_identities')
@Index('IDX_user_auth_identities_user_id', ['userId'])
@Index(
  'UQ_user_auth_identities_provider_issuer_subject_null_tenant',
  ['provider', 'issuer', 'providerSubject'],
  { unique: true, where: '"tenant_id" IS NULL' },
)
@Index(
  'UQ_user_auth_identities_provider_issuer_subject_tenant',
  ['provider', 'issuer', 'providerSubject', 'tenantId'],
  { unique: true, where: '"tenant_id" IS NOT NULL' },
)
export class UserAuthIdentityOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_user_auth_identities',
  })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_user_auth_identities_user_id',
  })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  provider: UserAuthProvider;

  @Column({ type: 'varchar', length: 500 })
  issuer: string;

  @Column({ name: 'provider_subject', type: 'varchar', length: 255 })
  providerSubject: string;

  @Column({
    name: 'provider_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  providerEmail: string | null;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'tenant_id', type: 'varchar', length: 255, nullable: true })
  tenantId: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
