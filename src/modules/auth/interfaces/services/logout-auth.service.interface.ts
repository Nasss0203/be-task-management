export interface LogoutAuthResult {
  success: boolean;
}

export interface LogoutAuthService {
  logout(refreshToken?: string): Promise<LogoutAuthResult>;
}
