export class LogoutAuthCommand {
  constructor(public readonly refreshToken?: string) {}
}
