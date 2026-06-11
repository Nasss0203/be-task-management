import { PageTemplate } from '../../domain/entities/page_template.entity';

export interface PageTemplatesService {
  findOne(id: string): Promise<PageTemplate>;
}
