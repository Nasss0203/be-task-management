import { User } from 'src/modules/users/domain/entities/user.entity';

export interface CreateLocalAuthUserInput {
  email: string;
  username: string;
  passwordHash: string;
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
  findByEmailAndUsername(
    email: string,
    username: string,
  ): Promise<User | null>;
  findProfileById(id: string): Promise<User | null>;
  createLocalUser(input: CreateLocalAuthUserInput): Promise<User>;
  createGoogleUser(input: CreateGoogleAuthUserInput): Promise<User>;
  save(user: User): Promise<User>;
}
