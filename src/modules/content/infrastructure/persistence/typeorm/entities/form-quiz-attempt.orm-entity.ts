import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

import type { FormQuizResult } from 'src/modules/content/domain/entities/form-quiz-attempt.entity';
import { DatabaseRowOrmEntity } from 'src/modules/database/infrastructure/persistence/typeorm/entities/database-row.orm-entity';
import { User } from 'src/modules/identity/identity.types';

import { PageBlockOrmEntity } from './page-block.orm-entity';

@Entity('form_quiz_attempts')
@Unique('UQ_form_quiz_attempts_section_user_attempt', [
  'section_block_id',
  'user_id',
  'attempt_no',
])
@Index('IDX_form_quiz_attempts_row_id', ['row_id'])
export class FormQuizAttemptOrmEntity {
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  @Column({
    type: 'uuid',
  })
  section_block_id: string;

  @ManyToOne(() => PageBlockOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_block_id' })
  section_block?: PageBlockOrmEntity;

  @Column({
    type: 'uuid',
  })
  user_id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({
    type: 'integer',
  })
  attempt_no: number;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  row_id: string | null;

  @ManyToOne(() => DatabaseRowOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'row_id' })
  row?: DatabaseRowOrmEntity | null;

  @Column({
    type: 'integer',
  })
  score: number;

  @Column({
    type: 'integer',
  })
  max_score: number;

  @Column({
    type: 'jsonb',
  })
  results: FormQuizResult[];

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;
}
