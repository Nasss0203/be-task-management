export class SendAdminUserVerificationEmailCommand {
  constructor(public readonly targetUserId: string) {}
}
