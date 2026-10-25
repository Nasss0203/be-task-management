export class InvalidDatabaseViewFilterException extends Error {
  constructor(message: string) {
    super(message);

    this.name = InvalidDatabaseViewFilterException.name;
  }
}
