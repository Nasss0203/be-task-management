export class InvalidPropertyNameException extends Error {
  constructor(message = 'Invalid property name') {
    super(message);

    this.name = InvalidPropertyNameException.name;
  }
}
