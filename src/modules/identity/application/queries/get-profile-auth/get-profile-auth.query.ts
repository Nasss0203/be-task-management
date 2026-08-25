import { type IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';

export class GetProfileAuthQuery {
  constructor(public readonly payload: IUserJwtPayload) {}
}
