export class InvalidAiToolCallTransitionException extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition AI tool call from ${from} to ${to}`);
    this.name = InvalidAiToolCallTransitionException.name;
  }
}
