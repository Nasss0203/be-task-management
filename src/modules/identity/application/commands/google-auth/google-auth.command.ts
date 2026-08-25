import { type GoogleUserPayload } from 'src/types/google-user-payload.interface';

export class GoogleAuthCommand {
  constructor(public readonly googleUser: GoogleUserPayload) {}
}
