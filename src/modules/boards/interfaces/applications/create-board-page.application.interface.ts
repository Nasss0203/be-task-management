import { CreateBoardAndAttachDto } from '../../dto/create-board-and-attach.dto';
import { BoardResponseDto } from '../../dto/response/board.response.dto';

export interface CreateBoardAndAttachToPageApplication {
  execute(dto: CreateBoardAndAttachDto): Promise<BoardResponseDto>;
}
