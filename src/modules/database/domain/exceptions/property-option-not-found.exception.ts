export class PropertyOptionNotFoundException extends Error {
  constructor() {
    super('Property option not found');

    this.name = PropertyOptionNotFoundException.name;
  }
}
