export class InvalidAiGenerationTransitionException extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition AI generation from ${from} to ${to}`);
    this.name = InvalidAiGenerationTransitionException.name;
  }
}
