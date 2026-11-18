import { type GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { type AuthClientInfo } from '../../services/issue-auth-token.service';

export class GoogleAuthCommand {
  constructor(
    public readonly googleUser: GoogleUserPayload,
    public readonly client?: AuthClientInfo,
  ) {}
}
