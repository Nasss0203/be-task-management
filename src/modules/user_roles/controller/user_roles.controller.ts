import { Controller } from '@nestjs/common';
import { UserRolesService } from '../user_roles.service';

@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}
}
