import { CreateBoardDto } from '../../dto/create-board.dto';
import { BoardResponseDto } from '../../dto/response/board.response.dto';

export interface CreateBoardApplication {
  create(createBoardDto: CreateBoardDto): Promise<BoardResponseDto>;
}
