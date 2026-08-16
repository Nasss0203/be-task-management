export class PropertyOptionInUseException extends Error {
  constructor() {
    super('Property option is currently in use');

    this.name = PropertyOptionInUseException.name;
  }
}
