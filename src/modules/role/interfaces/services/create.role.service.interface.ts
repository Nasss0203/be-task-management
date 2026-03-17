import { RoleModel } from '../../domain/model/role.model';
import { CreateRoleDto } from '../../dto/create-role.dto';

export interface CreateRoleService {
  create(createRoleDto: CreateRoleDto): Promise<RoleModel>;
}
