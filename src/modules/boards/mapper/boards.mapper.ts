import { Board } from '../domain/entities/board.entity';
import { BoardModel } from '../domain/models/board.model';
import { BoardResponseDto } from '../dto/response/board.response.dto';
import { SaveBoardInput } from '../interfaces/repositories/create.board.repository.interface';

export class BoardMapper {
  static toModel(entity: Board): BoardModel {
    return new BoardModel(
      entity.id,
      entity.workspaceId,
      entity.projectId,
      entity.name,
      entity.viewType,
      entity.createdBy,
      entity.updatedBy ?? null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(model: BoardModel | SaveBoardInput): Board {
    const e = new Board();

    if (model.id != null) e.id = model.id;
    e.workspaceId = model.workspaceId;
    e.projectId = model.projectId;
    e.name = model.name;
    e.viewType = model.viewType;

    if (model.createdBy != null) e.createdBy = model.createdBy;
    if (model.updatedBy !== undefined) e.updatedBy = model.updatedBy;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }

  static toResponse(model: BoardModel): BoardResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      name: model.name,
      viewType: model.viewType,
      createdBy: model.createdBy,
      updatedBy: model.updatedBy,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
