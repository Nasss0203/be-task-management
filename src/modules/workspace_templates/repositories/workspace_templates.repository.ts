import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { WorkspaceTemplate } from '../domain/entities/workspace_template.entity';
import type { WorkspaceTemplatesRepository } from '../interfaces/repositories/workspace_templates.repository.interface';
import { FindWorkspaceTemplatesDto } from '../dto/find-workspace-templates.dto';
import {
  TemplateStatus,
  TemplateVisibility,
} from 'src/common/enum/template.enum';
import { WorkspaceTemplateMapper } from '../mapper/workspace_template.mapper';
import {
  PaginatedWorkspaceTemplateModels,
  WorkspaceTemplateModel,
} from '../domain/models/workspace_template.model';

@Injectable()
export class WorkspaceTemplatesRepositoryImpl implements WorkspaceTemplatesRepository {
  constructor(
    @InjectRepository(WorkspaceTemplate)
    private readonly repository: Repository<WorkspaceTemplate>,
  ) {}

  async findAll(
    where?: FindOptionsWhere<WorkspaceTemplate>,
  ): Promise<WorkspaceTemplateModel[]> {
    const entities = await this.repository.find({ where });
    return entities.map((entity) => WorkspaceTemplateMapper.toModel(entity));
  }

  async findOne(id: string): Promise<WorkspaceTemplateModel | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? WorkspaceTemplateMapper.toModel(entity) : null;
  }

  async findOneAvailableForUser(
    id: string,
    userId: string,
  ): Promise<WorkspaceTemplateModel | null> {
    const query = this.repository.createQueryBuilder('wt');
    query.where('wt.id = :id', { id });

    query.andWhere(
      `(
        wt.is_system = true
        OR wt.visibility = :publicVisibility
        OR (wt.visibility = :privateVisibility AND wt.created_by = :userId)
        OR (wt.visibility = :workspaceVisibility AND wt.workspace_id IN (
          SELECT workspace_id FROM user_workspaces WHERE user_id = :userId
        ))
      )`,
      {
        publicVisibility: TemplateVisibility.PUBLIC,
        privateVisibility: TemplateVisibility.PRIVATE,
        workspaceVisibility: TemplateVisibility.WORKSPACE,
        userId,
      },
    );

    const entity = await query.getOne();
    return entity ? WorkspaceTemplateMapper.toModel(entity) : null;
  }

  async findAllAvailableForUser(
    userId?: string,
    filters?: FindWorkspaceTemplatesDto,
  ): Promise<PaginatedWorkspaceTemplateModels> {
    const query = this.repository.createQueryBuilder('wt');

    query.andWhere('wt.status = :status', {
      status: filters?.status || TemplateStatus.PUBLISHED,
    });

    if (!userId) {
      query.andWhere(
        '(wt.is_system = true OR wt.visibility = :publicVisibility)',
        { publicVisibility: TemplateVisibility.PUBLIC },
      );
    } else {
      query.andWhere(
        `(
          wt.is_system = true
          OR wt.visibility = :publicVisibility
          OR (wt.visibility = :privateVisibility AND wt.created_by = :userId)
          OR (wt.visibility = :workspaceVisibility AND wt.workspace_id IN (
            SELECT workspace_id FROM user_workspaces WHERE user_id = :userId
          ))
        )`,
        {
          publicVisibility: TemplateVisibility.PUBLIC,
          privateVisibility: TemplateVisibility.PRIVATE,
          workspaceVisibility: TemplateVisibility.WORKSPACE,
          userId,
        },
      );
    }

    if (filters) {
      if (filters.category) {
        query.andWhere('wt.category = :category', {
          category: filters.category,
        });
      }

      if (filters.search) {
        query.andWhere(
          '(wt.name ILIKE :search OR wt.description ILIKE :search)',
          { search: `%${filters.search}%` },
        );
      }

      if (filters.visibility) {
        query.andWhere('wt.visibility = :visibility', {
          visibility: filters.visibility,
        });
      }

      if (filters.workspaceId) {
        query.andWhere('wt.workspace_id = :workspaceId', {
          workspaceId: filters.workspaceId,
        });
      }

      if (
        filters.ownedByMe !== undefined &&
        filters.ownedByMe !== false &&
        String(filters.ownedByMe) !== 'false'
      ) {
        if (userId) {
          query.andWhere('wt.created_by = :userId', { userId });
        } else {
          query.andWhere('1 = 0'); // Force empty result if requesting owned templates without login
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      query.skip((page - 1) * limit);
      query.take(limit);

      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'DESC';
      // In QueryBuilder, property paths for ordering are 'wt.createdAt', etc.
      query.orderBy(`wt.${sortBy}`, sortOrder);
    } else {
      query.orderBy('wt.createdAt', 'DESC');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;

    const [entities, total] = await query.getManyAndCount();

    return {
      data: entities.map((entity) => WorkspaceTemplateMapper.toModel(entity)),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: Partial<WorkspaceTemplate>): Promise<void> {
    await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
