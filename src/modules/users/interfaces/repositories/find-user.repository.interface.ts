import { UserModel } from '../../domain/models/user.model';

export interface FindUserRepository {
  findUserByUsername(username: string): Promise<UserModel | null>;
  findUserByEmail(email: string): Promise<UserModel | null>;
  findUserById(id: string): Promise<UserModel | null>;
  searchUsers(keyword: string): Promise<UserModel[]>;
}
