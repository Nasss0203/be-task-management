import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { PropertyType } from '../../../domain/enums/property-type.enum';

export class AddPropertyRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PropertyType)
  type: PropertyType;
}
