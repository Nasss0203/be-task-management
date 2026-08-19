import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { DatabaseViewType } from '../../../domain/enums/database-view-type.enum';

export class CreateDatabaseViewRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(DatabaseViewType)
  type: DatabaseViewType;
}
