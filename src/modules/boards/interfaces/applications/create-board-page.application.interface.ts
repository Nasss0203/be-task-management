import { CreateBoardDto } from '../../dto/create-board.dto';
import { BoardResponseDto } from '../../dto/response/board.response.dto';

export interface CreateBoardAndAttachToPageApplication {
  execute(dto: CreateBoardDto): Promise<BoardResponseDto>;
}
