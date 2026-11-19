import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.orm-entity';

@Entity('login_attempts')
@Index('IDX_login_attempts_created_at', ['createdAt'])
@Index('IDX_login_attempts_user_created_at', ['userId', 'createdAt'])
@Index('IDX_login_attempts_ip_created_at', ['ipAddress', 'createdAt'])
export class LoginAttemptOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({
    name: 'attempted_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  attemptedEmail: string | null;

  @Column({ type: 'varchar', length: 16 })
  method: string;

  @Column({ type: 'varchar', length: 16 })
  result: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  reason: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
