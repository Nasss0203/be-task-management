import { RowValueData } from './row-value.type';

export class RowValue {
  constructor(
    readonly id: string,
    readonly rowId: string,
    readonly propertyId: string,
    private value: RowValueData,
  ) {}

  getId(): string {
    return this.id;
  }

  getRowId(): string {
    return this.rowId;
  }

  getPropertyId(): string {
    return this.propertyId;
  }

  getValue(): RowValueData {
    return this.value;
  }

  changeValue(value: RowValueData): void {
    this.value = value;
  }
}
