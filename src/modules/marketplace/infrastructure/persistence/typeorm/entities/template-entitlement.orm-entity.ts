import { User } from 'src/modules/identity/identity.types';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { TemplateEntitlementSource } from '../../../../domain/enums/template-entitlement-source.enum';
import { PageTemplateOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template.orm-entity';

@Entity('template_entitlements')
@Unique('UQ_template_entitlements_template_user', ['templateId', 'userId'])
export class TemplateEntitlementOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_template_entitlements',
  })
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => PageTemplateOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'template_id',
    foreignKeyConstraintName: 'FK_template_entitlements_template',
  })
  template: PageTemplateOrmEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_template_entitlements_user',
  })
  user: User;

  @Column({
    type: 'enum',
    enum: TemplateEntitlementSource,
    default: TemplateEntitlementSource.FREE_CLAIM,
  })
  source: TemplateEntitlementSource;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
