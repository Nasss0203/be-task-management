import { User } from 'src/modules/identity/identity.types';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

@Entity('creator_profiles')
@Unique('UQ_creator_profiles_handle', ['handle'])
@Check(
  'CHK_creator_profiles_handle',
  `"handle" ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$'`,
)
export class CreatorProfileOrmEntity {
  @PrimaryColumn({
    name: 'user_id',
    type: 'uuid',
    primaryKeyConstraintName: 'PK_creator_profiles',
  })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_creator_profiles_user',
  })
  user: User;

  @Column({ name: 'handle', type: 'varchar', length: 30 })
  handle: string;

  @Column({ name: 'display_name', type: 'varchar', length: 60, nullable: true })
  displayName: string | null;

  @Column({ name: 'headline', type: 'varchar', length: 120, nullable: true })
  headline: string | null;

  @Column({ name: 'bio', type: 'varchar', length: 1000, nullable: true })
  bio: string | null;

  @Column({ name: 'website_url', type: 'varchar', length: 255, nullable: true })
  websiteUrl: string | null;

  @Column({ name: 'x_url', type: 'varchar', length: 255, nullable: true })
  xUrl: string | null;

  @Column({ name: 'github_url', type: 'varchar', length: 255, nullable: true })
  githubUrl: string | null;

  @Column({
    name: 'linkedin_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  linkedinUrl: string | null;

  @Column({ name: 'youtube_url', type: 'varchar', length: 255, nullable: true })
  youtubeUrl: string | null;

  @Column({
    name: 'facebook_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  facebookUrl: string | null;

  @Column({ name: 'avatar_key', type: 'varchar', length: 500, nullable: true })
  avatarKey: string | null;

  @Column({ name: 'cover_key', type: 'varchar', length: 500, nullable: true })
  coverKey: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
