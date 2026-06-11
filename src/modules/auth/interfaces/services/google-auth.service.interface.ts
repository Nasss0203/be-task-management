import { User } from 'src/modules/users/domain/entities/user.entity';
import { GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { AuthTokenPair } from './issue-auth-token.service.interface';

export type GoogleAuthResult = AuthTokenPair & {
  user: User;
};

export interface GoogleAuthService {
  loginWithGoogle(googleUser: GoogleUserPayload): Promise<GoogleAuthResult>;
}
