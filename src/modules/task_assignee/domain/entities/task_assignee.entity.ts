import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('task_assignees')
@Index('UQ_TASK_ASSIGNEES_TASK_USER', ['taskId', 'userId'], {
  unique: true,
})
@Index('IDX_TASK_ASSIGNEES_TASK_ID', ['taskId'])
@Index('IDX_TASK_ASSIGNEES_USER_ID', ['userId'])
@Index('IDX_TASK_ASSIGNEES_ASSIGNED_BY', ['assignedBy'])
export class TaskAssignee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedBy: string | null;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamp' })
  assignedAt: Date;

  @ManyToOne(() => Task, (task) => task.assignees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_by' })
  assignedByUser: User | null;
}
