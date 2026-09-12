import { ResourceAccessLevel } from '../../../domain/constants/resource-access-level.constant';

export interface PageShareUserDto {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

export interface PageShareWithUserDto {
  id: string;
  userId: string;
  accessLevel: ResourceAccessLevel;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  user: PageShareUserDto;
}
