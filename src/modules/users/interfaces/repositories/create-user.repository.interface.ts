import { UserModel } from '../../domain/models/user.model';

export type SaveUserInput = Pick<
  UserModel,
  'username' | 'email' | 'passwordHash'
> &
  Partial<
    Pick<UserModel, 'updatedAt' | 'createdAt' | 'id' | 'deletedAt' | 'isActive'>
  >;
