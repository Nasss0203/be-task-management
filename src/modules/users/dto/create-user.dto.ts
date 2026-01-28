export class CreateUserDto {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
