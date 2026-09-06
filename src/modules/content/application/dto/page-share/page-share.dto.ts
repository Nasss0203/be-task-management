import { ResourceAccessLevel } from '../../../domain/constants/resource-access-level.constant';

export interface PageShareDto {
  id: string;
  userId: string;
  accessLevel: ResourceAccessLevel;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
