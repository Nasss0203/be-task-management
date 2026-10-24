export class InvalidDatabaseViewSortException extends Error {
  constructor(message: string) {
    super(message);

    this.name = InvalidDatabaseViewSortException.name;
  }
}
