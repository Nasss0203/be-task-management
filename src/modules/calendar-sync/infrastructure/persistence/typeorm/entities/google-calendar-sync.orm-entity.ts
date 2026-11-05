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

import { DatabaseOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database.orm-entity';

import { GoogleCalendarConnectionOrmEntity } from './google-calendar-connection.orm-entity';

@Entity('google_calendar_syncs')
@Index(
  'UQ_google_calendar_syncs_connection_database',
  ['connectionId', 'databaseId'],
  { unique: true },
)
export class GoogleCalendarSyncOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'connection_id', type: 'uuid' })
  connectionId: string;

  @ManyToOne(() => GoogleCalendarConnectionOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'connection_id' })
  connection: GoogleCalendarConnectionOrmEntity;

  @Column({ name: 'database_id', type: 'uuid' })
  databaseId: string;

  @ManyToOne(() => DatabaseOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'database_id' })
  database: DatabaseOrmEntity;

  @Column({ name: 'date_property_id', type: 'uuid' })
  datePropertyId: string;

  @Column({ name: 'assigned_to_me_only', type: 'boolean', default: false })
  assignedToMeOnly: boolean;

  @Column({ name: 'google_calendar_id', type: 'varchar', length: 255 })
  googleCalendarId: string;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ name: 'last_error', type: 'varchar', length: 64, nullable: true })
  lastError: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
