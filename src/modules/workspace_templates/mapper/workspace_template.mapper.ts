import { WorkspaceTemplate } from '../domain/entities/workspace_template.entity';
import { WorkspaceTemplateModel } from '../domain/models/workspace_template.model';

export class WorkspaceTemplateMapper {
  static toModel(entity: WorkspaceTemplate): WorkspaceTemplateModel {
    const model = new WorkspaceTemplateModel();
    model.id = entity.id;
    model.name = entity.name;
    model.description = entity.description;
    model.category = entity.category;
    model.coverUrl = entity.coverUrl;
    model.config = entity.config;
    model.isSystem = entity.isSystem;
    model.pageTemplateId = entity.pageTemplateId;
    model.status = entity.status;
    model.visibility = entity.visibility;
    model.createdBy = entity.createdBy;
    model.workspaceId = entity.workspaceId;
    model.useCount = entity.useCount;
    model.likesCount = entity.likesCount;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    model.deletedAt = entity.deletedAt;
    return model;
  }
}
