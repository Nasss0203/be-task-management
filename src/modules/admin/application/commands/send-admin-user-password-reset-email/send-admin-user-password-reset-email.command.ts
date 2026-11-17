export class SendAdminUserPasswordResetEmailCommand {
  constructor(public readonly targetUserId: string) {}
}
