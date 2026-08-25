export class UserResponseDto {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
