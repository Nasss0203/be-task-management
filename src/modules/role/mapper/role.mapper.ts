import { Role } from '../domain/entities/role.entity';
import { RoleModel } from '../domain/model/role.model';
import { RoleResponseDto } from '../dto/reponse/role.response.dto';
import { SaveRoleInput } from '../interfaces/repositories/role.repository.interface';

export class RoleMapper {
  static toModel(entity: Role): RoleModel {
    return new RoleModel(
      entity.id,
      entity.name,
      entity.workspace_id,
      entity.created_at,
    );
  }

  static toEntity(data: RoleModel | SaveRoleInput): Role {
    const entity = new Role();
    entity.id = data.id!;
    entity.name = data.name;
    entity.workspace_id = data.workspace_id;
    entity.created_at = data.created_at!;
    return entity;
  }
  static toResponse(model: RoleModel): RoleResponseDto {
    return {
      id: model.id,
      name: model.name,
      created_at: model.created_at,
      workspace_id: model.workspace_id,
    };
  }
}
