import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';

import { PageBlockOrmEntity } from './page-block.orm-entity';

@Entity('form_answer_keys')
@Check('CHK_form_answer_keys_points_positive', '"points" > 0')
export class FormAnswerKeyOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  field_block_id: string;

  @ManyToOne(() => PageBlockOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'field_block_id' })
  field_block?: PageBlockOrmEntity;

  @Column({
    type: 'jsonb',
  })
  correct_value: RowValueData;

  @Column({
    type: 'integer',
  })
  points: number;
}
