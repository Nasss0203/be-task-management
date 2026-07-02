import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { TaskPositionContext } from '../../constants/task-position-context.constant';

@Entity('task_positions')
@Index('UQ_TASK_POSITION', ['taskId', 'context', 'contextId'], {
  unique: true,
})
@Index('IDX_TASK_POSITION_LOOKUP', ['context', 'contextId', 'position'])
@Index('IDX_TASK_POSITION_TASK', ['taskId'])
export class TaskPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @Column({ name: 'context', type: 'varchar', length: 20 })
  context: TaskPositionContext;

  @Column({ name: 'context_id', type: 'uuid' })
  contextId: string;

  @Column({
    name: 'position',
    type: 'numeric',
    precision: 30,
    scale: 15,
  })
  position: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;
}
