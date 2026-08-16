export class CannotDeleteTitlePropertyException extends Error {
  constructor() {
    super('Title property cannot be deleted');

    this.name = CannotDeleteTitlePropertyException.name;
  }
}
