import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '../domain/entities/workspace_member.entity';
import { WorkspaceMemberModel } from '../domain/models/workspace-member.model';
import {
  type SaveWorkspaceMemberInput,
  WorkspaceMemberRepository,
} from '../interfaces/repositories/workspace-member.repository.interface';
import { WorkspaceMemeberMapper } from '../mapper/workspace-member.mapper';

@Injectable()
export class WorkspaceMemberRepositoryImpl implements WorkspaceMemberRepository {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly repo: Repository<WorkspaceMember>,
  ) {}

  async create(input: SaveWorkspaceMemberInput): Promise<WorkspaceMemberModel> {
    const entity = WorkspaceMemeberMapper.toEntity(input);
    const saved = await this.repo.save(entity);

    return WorkspaceMemeberMapper.toModel(saved);
  }
}
