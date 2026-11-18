import { type AuthClientInfo } from '../../services/issue-auth-token.service';

export class RefreshAuthCommand {
  constructor(
    public readonly refreshToken?: string,
    public readonly client?: AuthClientInfo,
  ) {}
}
