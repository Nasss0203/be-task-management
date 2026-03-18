import { EntityManager } from 'typeorm';
import { PageModel } from '../../domain/models/page.model';
import { CreatePageDto } from '../../dto/create-page.dto';

export interface CreatePageService {
  create(
    createWorkspaceDto: CreatePageDto,
    manager: EntityManager,
  ): Promise<PageModel>;
}
