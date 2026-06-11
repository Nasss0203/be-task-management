import { AuthTokenPair } from './issue-auth-token.service.interface';

export interface RefreshAuthService {
  refresh(refreshToken?: string): Promise<AuthTokenPair>;
}
