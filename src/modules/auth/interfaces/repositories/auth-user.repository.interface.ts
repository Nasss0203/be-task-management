import { User } from 'src/modules/users/domain/entities/user.entity';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export interface CreateLocalAuthUserInput {
  email: string;
  username: string;
  passwordHash: string;
  emailVerificationToken: string;
  emailVerificationExpires: Date;
}

export interface CreateGoogleAuthUserInput {
  email: string;
  username: string;
  googleId: string;
  avatarUrl: string | null;
}

export interface AuthUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmailOrUsername(email: string, username: string): Promise<User | null>;
  findByEmailAndUsername(email: string, username: string): Promise<User | null>;
  findByEmailVerificationToken(token: string): Promise<User | null>;
  findByResetPasswordToken(token: string): Promise<User | null>;
  findProfileById(id: string): Promise<User | null>;
  createLocalUser(
    input: CreateLocalAuthUserInput,
    context?: PersistenceContext,
  ): Promise<User>;
  createGoogleUser(input: CreateGoogleAuthUserInput): Promise<User>;
  save(user: User): Promise<User>;
}
