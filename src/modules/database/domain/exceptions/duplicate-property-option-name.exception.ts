export class DuplicatePropertyOptionNameException extends Error {
  constructor() {
    super('Property option name already exists');

    this.name = DuplicatePropertyOptionNameException.name;
  }
}
