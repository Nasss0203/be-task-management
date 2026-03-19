import { EntityManager } from 'typeorm';
import { CreatePageDto } from '../../dto/create-page.dto';

export interface CreatePageService {
  create(createPageDto: CreatePageDto, manager: EntityManager): Promise<any>;
}
