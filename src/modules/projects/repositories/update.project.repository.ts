import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../domain/entities/project.entity';
import { UpdateProjectDto } from '../dto/update-project.dto';
import type { UpdateProjectRepository } from '../interfaces/repositories/update.project.repository.interface';

@Injectable()
export class UpdateProjectRepositoryImpl implements UpdateProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
  ) {}

  async update(
    projectId: string,
    workspaceId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<void> {
    await this.repository.update(
      {
        id: projectId,
        workspace_id: workspaceId,
      },
      updateProjectDto,
    );
  }
}
