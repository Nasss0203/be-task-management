import { IAuth } from 'src/types/auth';
import { AuthTokenPair } from './issue-auth-token.service.interface';

export interface LoginAuthService {
  login(auth: IAuth): Promise<AuthTokenPair>;
}
