import { PartialType } from '@nestjs/swagger';
import { CreateUserRoleDto } from './create-user_role.dto';

export class UpdateUserRoleDto extends PartialType(CreateUserRoleDto) {}
