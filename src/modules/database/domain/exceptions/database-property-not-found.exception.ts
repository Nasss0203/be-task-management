export class DatabasePropertyNotFoundException extends Error {
  constructor() {
    super('Database property not found');

    this.name = DatabasePropertyNotFoundException.name;
  }
}
