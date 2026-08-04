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
  UpdateDateColumn,
} from 'typeorm';

@Entity('task_comments')
@Index('IDX_TASK_COMMENTS_WORKSPACE_ID', ['workspaceId'])
@Index('IDX_TASK_COMMENTS_PROJECT_ID', ['projectId'])
@Index('IDX_TASK_COMMENTS_TASK_ID', ['taskId'])
@Index('IDX_TASK_COMMENTS_AUTHOR_ID', ['authorId'])
@Index('IDX_TASK_COMMENTS_TASK_CREATED_AT', ['taskId', 'createdAt'])
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_edited', type: 'boolean', default: false })
  isEdited: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
