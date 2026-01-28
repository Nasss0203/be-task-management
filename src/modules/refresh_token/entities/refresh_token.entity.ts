import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
@Index('idx_refresh_token_token', ['token'])
@Index('idx_refresh_token_user', ['user_id'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 512 })
  token: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_agent: string;

  @Column({ type: 'inet', nullable: true })
  ip_address: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
