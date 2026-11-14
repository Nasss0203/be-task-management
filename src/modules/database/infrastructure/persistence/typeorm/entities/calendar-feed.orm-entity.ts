import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { DatabaseOrmEntity } from './database.orm-entity';

@Entity('calendar_feeds')
@Index('UQ_calendar_feeds_active', ['databaseId', 'createdBy'], {
  unique: true,
  where: '"revoked_at" IS NULL',
})
export class CalendarFeedOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'database_id', type: 'uuid' })
  databaseId: string;

  @ManyToOne(() => DatabaseOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'database_id' })
  database: DatabaseOrmEntity;

  @Column({ name: 'date_property_id', type: 'uuid' })
  datePropertyId: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
