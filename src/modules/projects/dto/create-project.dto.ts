import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { ProjectVisibility } from '../domain/entities/project.entity';

export class CreateProjectDto {
  workspace_id: string;

  name: string;

  key: string;

  visibility?: ProjectVisibility;

  task_seq?: number;

  created_by: string;

  create_default_board?: boolean;
  default_board_view_type?: BoardViewType;
}
