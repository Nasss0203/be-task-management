import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/modules/identity/identity.types';

@Entity('google_calendar_connections')
@Index('UQ_google_calendar_connections_user', ['userId'], { unique: true })
export class GoogleCalendarConnectionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'google_email', type: 'varchar', length: 320 })
  googleEmail: string;

  @Column({ name: 'refresh_token_encrypted', type: 'text' })
  refreshTokenEncrypted: string;

  @Column({ name: 'last_error', type: 'varchar', length: 64, nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
