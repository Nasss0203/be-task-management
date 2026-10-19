import { User } from 'src/modules/identity/identity.types';
import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { PageTemplateOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template.orm-entity';

@Entity('template_likes')
@Index('IDX_template_likes_user_id', ['userId'])
export class TemplateLikeOrmEntity {
  @PrimaryColumn({
    name: 'template_id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_template_likes',
  })
  templateId: string;

  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_template_likes',
  })
  userId: string;

  @ManyToOne(() => PageTemplateOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'template_id',
    foreignKeyConstraintName: 'FK_template_likes_template',
  })
  template: PageTemplateOrmEntity;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_template_likes_user',
  })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
