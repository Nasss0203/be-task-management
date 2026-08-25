import { RegisterUserDto } from '../../dto/user/create-user.dto';

export class RegisterAuthCommand {
  constructor(public readonly registerUserDto: RegisterUserDto) {}
}
