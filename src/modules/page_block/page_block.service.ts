import { Injectable } from '@nestjs/common';
import { CreatePageBlockDto } from './dto/create-page_block.dto';
import { UpdatePageBlockDto } from './dto/update-page_block.dto';

@Injectable()
export class PageBlockService {
  create(createPageBlockDto: CreatePageBlockDto) {
    return 'This action adds a new pageBlock';
  }

  findAll() {
    return `This action returns all pageBlock`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pageBlock`;
  }

  update(id: number, updatePageBlockDto: UpdatePageBlockDto) {
    return `This action updates a #${id} pageBlock`;
  }

  remove(id: number) {
    return `This action removes a #${id} pageBlock`;
  }
}
