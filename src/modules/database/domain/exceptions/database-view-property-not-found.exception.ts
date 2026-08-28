export class DatabaseViewPropertyNotFoundException extends Error {
  constructor() {
    super('Property does not belong to database view');

    this.name = DatabaseViewPropertyNotFoundException.name;
  }
}
