import { RowValueData } from '../../../domain/aggregates/row/row-value.type';

export class SetRowValueCommand {
  constructor(
    public readonly rowId: string,
    public readonly propertyId: string,
    public readonly value: RowValueData,
  ) {}
}
