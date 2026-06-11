import { User } from 'src/modules/users/domain/entities/user.entity';
import { IUserJwtPayload } from '../type';

export interface GetProfileAuthApplication {
  getProfile(payload: IUserJwtPayload): Promise<User>;
}
