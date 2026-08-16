import { IsDefined } from 'class-validator';
import { type RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';

export class SetRowValueRequest {
  @IsDefined()
  value: RowValueData;
}
