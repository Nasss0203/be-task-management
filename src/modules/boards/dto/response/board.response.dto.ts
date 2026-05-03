import { BoardViewType } from '../../domain/entities/board.entity';

export class BoardResponseDto {
  id: string;

  workspaceId: string;

  projectId: string;

  name: string;

  viewType: BoardViewType;

  createdBy: string;

  updatedBy: string | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  deletedBy: string | null;
}
