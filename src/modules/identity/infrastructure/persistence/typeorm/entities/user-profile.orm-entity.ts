import { User } from './user.orm-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  displayName: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 150, nullable: true })
  fullName: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 30, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  location: string | null;

  @Column({ name: 'job_title', type: 'varchar', length: 150, nullable: true })
  jobTitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ name: 'cover_url', type: 'varchar', length: 500, nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  language: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
