import { RegisterUserDto } from 'src/modules/users/dto/create-user.dto';
import { RegisterAuthResult } from '../services/register-auth.service.interface';

export interface RegisterAuthApplication {
  register(registerUserDto: RegisterUserDto): Promise<RegisterAuthResult>;
}
