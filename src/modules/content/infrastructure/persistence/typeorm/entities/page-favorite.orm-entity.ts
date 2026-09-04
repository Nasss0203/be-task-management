import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  Unique,
} from 'typeorm';

@Entity('page_favorites')
@Unique('UQ_page_favorites_user_page', ['user_id', 'page_id'])
@Index('IDX_page_favorites_user_id', ['user_id'])
@Index('IDX_page_favorites_page_id', ['page_id'])
export class PageFavoriteOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  user_id: string;

  @Column({
    type: 'uuid',
  })
  page_id: string;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;
}
