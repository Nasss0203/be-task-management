import { PropertyType } from '../../../domain/enums/property-type.enum';

export class AddPropertyCommand {
  constructor(
    public readonly databaseId: string,
    public readonly name: string,
    public readonly type: PropertyType,
  ) {}
}
