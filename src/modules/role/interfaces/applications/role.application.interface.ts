import { CreateRoleDto } from '../../dto/create-role.dto';
import { RoleResponseDto } from '../../dto/reponse/role.response.dto';

export interface CreateRoleApplication {
  create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto>;
}
