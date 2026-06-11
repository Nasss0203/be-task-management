import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceTemplate } from '../domain/entities/workspace_template.entity';
import { WorkspaceTemplatesRepository } from '../interfaces/repositories/workspace_templates.repository.interface';

@Injectable()
export class WorkspaceTemplatesRepositoryImpl implements WorkspaceTemplatesRepository {
  constructor(
    @InjectRepository(WorkspaceTemplate)
    private readonly repository: Repository<WorkspaceTemplate>,
  ) {}

  async findAll(where?: import('typeorm').FindOptionsWhere<WorkspaceTemplate>): Promise<WorkspaceTemplate[]> {
    return this.repository.find({
      where: where || { isSystem: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<WorkspaceTemplate | null> {
    return this.repository.findOne({ where: { id } });
  }
}
