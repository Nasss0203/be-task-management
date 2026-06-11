import { User } from 'src/modules/users/domain/entities/user.entity';

export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
}

export interface IssueAuthTokenService {
  issueTokens(user: User): Promise<AuthTokenPair>;
}
