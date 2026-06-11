import { PageTemplate } from '../../domain/entities/page_template.entity';
import { FindOptionsWhere } from 'typeorm';

export interface PageTemplatesRepository {
  findAll(where?: FindOptionsWhere<PageTemplate>): Promise<PageTemplate[]>;
  findOne(id: string): Promise<PageTemplate | null>;
}
