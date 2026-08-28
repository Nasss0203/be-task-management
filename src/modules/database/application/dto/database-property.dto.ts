import { PropertyType } from '../../domain/enums/property-type.enum';

export interface PropertyOptionDto {
  id: string;
  name: string;
  color: string | null;
  position: string;
}

export interface DatabasePropertyDto {
  id: string;
  databaseId: string;
  name: string;
  type: PropertyType;
  isDefault: boolean;
  isHideable: boolean;
  position: string;
  options: PropertyOptionDto[];
}
