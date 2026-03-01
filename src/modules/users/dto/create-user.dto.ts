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

export class RegisterUserDto {
  email: string;
  username: string;
  password: string;
}

export class LoginUserDto {
  email: string;
  password: string;
}
