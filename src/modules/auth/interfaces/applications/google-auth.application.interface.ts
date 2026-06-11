import { GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { GoogleAuthResult } from '../services/google-auth.service.interface';

export interface GoogleAuthApplication {
  loginWithGoogle(googleUser: GoogleUserPayload): Promise<GoogleAuthResult>;
}
