import { Project } from '../domain/entities/project.entity';
import { ProjectModel } from '../domain/models/projects.model';
import { ProjectResponseDto } from '../dto/reponse/project.response.dto';

export class ProjectMapper {
  static toModel(entity: Project): ProjectModel {
    return new ProjectModel(
      entity.id,
      entity.workspace_id,
      entity.name,
      entity.key,
      entity.visibility,
      entity.task_seq,
      entity.created_by,
      entity.created_at,
      entity.updated_at,

      entity.deletedAt ?? null,
      entity.deletedBy ?? null,
    );
  }

  static toEntity(model: ProjectModel): Project {
    const entity = new Project();

    entity.id = model.id;
    entity.workspace_id = model.workspace_id;
    entity.name = model.name;
    entity.key = model.key;
    entity.visibility = model.visibility;
    entity.task_seq = model.task_seq;
    entity.created_by = model.created_by;
    entity.created_at = model.created_at;
    entity.updated_at = model.updated_at;

    entity.deletedAt = model.deletedAt;
    entity.deletedBy = model.deletedBy;

    return entity;
  }

  static toResponse(model: ProjectModel): ProjectResponseDto {
    return {
      id: model.id,
      workspace_id: model.workspace_id,
      name: model.name,
      key: model.key,
      visibility: model.visibility,
      task_seq: model.task_seq,
      created_by: model.created_by,
      created_at: model.created_at,
      updated_at: model.updated_at,

      deletedAt: model.deletedAt,
      deletedBy: model.deletedBy,
    };
  }
}
