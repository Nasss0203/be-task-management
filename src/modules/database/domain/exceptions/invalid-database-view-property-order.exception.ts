export class InvalidDatabaseViewPropertyOrderException extends Error {
  constructor() {
    super('Property order must list every property of the view exactly once');

    this.name = InvalidDatabaseViewPropertyOrderException.name;
  }
}
