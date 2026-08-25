import { type IAuth } from 'src/types/auth';

export class LoginAuthCommand {
  constructor(public readonly auth: IAuth) {}
}
