export class ProcessSubscriptionExpiryCommand {
  constructor(public readonly now: Date = new Date()) {}
}
