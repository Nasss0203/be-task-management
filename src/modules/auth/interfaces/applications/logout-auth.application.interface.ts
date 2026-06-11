import { LogoutAuthResult } from '../services/logout-auth.service.interface';

export interface LogoutAuthApplication {
  logout(refreshToken?: string): Promise<LogoutAuthResult>;
}
