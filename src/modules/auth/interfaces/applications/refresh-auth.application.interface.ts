import { AuthTokenPair } from '../services/issue-auth-token.service.interface';

export interface RefreshAuthApplication {
  refresh(refreshToken?: string): Promise<AuthTokenPair>;
}
