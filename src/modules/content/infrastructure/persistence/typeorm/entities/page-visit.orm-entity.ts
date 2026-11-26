import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { User } from 'src/modules/identity/identity.types';

import { PageOrmEntity } from './page.orm-entity';

@Entity('page_visits')
@Unique('UQ_page_visits_user_page', ['user_id', 'page_id'])
@Index('IDX_page_visits_user_workspace_visited_at', [
  'user_id',
  'workspace_id',
  'visited_at',
])
export class PageVisitOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'uuid' })
  page_id: string;

  @ManyToOne(() => PageOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page?: PageOrmEntity;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @Column({ type: 'timestamptz' })
  visited_at: Date;
}
