import { EntityManager } from 'typeorm';
import { UserRoleModel } from '../../domain/model/user_role.model';
import { CreateUserRoleDto } from '../../dto/create-user_role.dto';

export interface CreateUserRoleService {
  create(
    createUserRoleDto: CreateUserRoleDto,
    manager?: EntityManager,
  ): Promise<UserRoleModel>;
}
