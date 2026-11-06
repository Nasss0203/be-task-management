import { User } from 'src/modules/identity/identity.types';
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

@Entity('slack_connections')
@Index('UQ_slack_connections_user', ['userId'], { unique: true })
export class SlackConnectionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'slack_team_id', type: 'varchar', length: 32 })
  slackTeamId: string;

  @Column({ name: 'slack_team_name', type: 'varchar', length: 255 })
  slackTeamName: string;

  @Column({ name: 'slack_user_id', type: 'varchar', length: 32 })
  slackUserId: string;

  @Column({ name: 'bot_token_encrypted', type: 'text' })
  botTokenEncrypted: string;

  @Column({ name: 'last_error', type: 'varchar', length: 64, nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
