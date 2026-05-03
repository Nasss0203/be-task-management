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

export enum UserActivityType {
  LOGIN = 'LOGIN',
  OPEN_APP = 'OPEN_APP',
  OPEN_WORKSPACE = 'OPEN_WORKSPACE',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
}

@Entity('user_activities')
@Index('IDX_user_activities_user_id', ['userId'])
@Index('IDX_user_activities_created_at', ['createdAt'])
export class UserActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: UserActivityType,
    enumName: 'user_activity_type_enum',
    default: UserActivityType.OPEN_APP,
  })
  type: UserActivityType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
