export const AUTH_TYPES = {
  applications: {
    RegisterAuthApplication: 'RegisterAuthApplication',
    LoginAuthApplication: 'LoginAuthApplication',
    RefreshAuthApplication: 'RefreshAuthApplication',
    LogoutAuthApplication: 'LogoutAuthApplication',
    GetProfileAuthApplication: 'GetProfileAuthApplication',
    GoogleAuthApplication: 'GoogleAuthApplication',
  },
  services: {
    RegisterAuthService: 'RegisterAuthService',
    LoginAuthService: 'LoginAuthService',
    RefreshAuthService: 'RefreshAuthService',
    LogoutAuthService: 'LogoutAuthService',
    ValidateUserAuthService: 'ValidateUserAuthService',
    GetProfileAuthService: 'GetProfileAuthService',
    IssueAuthTokenService: 'IssueAuthTokenService',
    GoogleAuthService: 'GoogleAuthService',
  },
  repositories: {
    AuthUserRepository: 'AuthUserRepository',
    AuthRefreshTokenRepository: 'AuthRefreshTokenRepository',
  },
};
