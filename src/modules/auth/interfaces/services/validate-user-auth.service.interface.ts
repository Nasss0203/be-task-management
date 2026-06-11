import { User } from 'src/modules/users/domain/entities/user.entity';

export interface ValidateUserAuthService {
  validateUser(email: string, password: string): Promise<User | null>;
  comparePassword(password: string, hash: string): boolean;
}
