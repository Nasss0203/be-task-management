import { DatabaseViewProperty } from '../../domain/aggregates/view/database-view-property.entity';

export class DatabaseViewPropertyDto {
  id: string;
  propertyId: string;
  position: string;
  visible: boolean;
  width: number | null;

  static fromDomain(property: DatabaseViewProperty): DatabaseViewPropertyDto {
    return {
      id: property.getId(),
      propertyId: property.getPropertyId(),
      position: property.getPosition(),
      visible: property.isVisible(),
      width: property.getWidth(),
    };
  }
}
