export class CannotDeleteDefaultPropertyException extends Error {
  constructor() {
    super('Default property cannot be deleted');

    this.name = CannotDeleteDefaultPropertyException.name;
  }
}
