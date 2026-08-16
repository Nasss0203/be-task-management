export class DuplicatePropertyNameException extends Error {
  constructor() {
    super('Database property name already exists');

    this.name = DuplicatePropertyNameException.name;
  }
}
