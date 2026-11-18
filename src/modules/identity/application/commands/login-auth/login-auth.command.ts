import { type IAuth } from 'src/types/auth';
import { type AuthClientInfo } from '../../services/issue-auth-token.service';

export class LoginAuthCommand {
  constructor(
    public readonly auth: IAuth,
    public readonly client?: AuthClientInfo,
  ) {}
}
