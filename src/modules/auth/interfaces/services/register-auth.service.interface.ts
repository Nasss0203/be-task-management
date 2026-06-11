import { RegisterUserDto } from 'src/modules/users/dto/create-user.dto';

export interface RegisterAuthResult {
  id: string;
  email: string;
  username: string;
}

export interface RegisterAuthService {
  register(registerUserDto: RegisterUserDto): Promise<RegisterAuthResult>;
}
