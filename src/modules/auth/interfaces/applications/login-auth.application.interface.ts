import { IAuth } from 'src/types/auth';
import { AuthTokenPair } from '../services/issue-auth-token.service.interface';

export interface LoginAuthApplication {
  login(auth: IAuth): Promise<AuthTokenPair>;
}
