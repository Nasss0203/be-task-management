import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  WorkspacePermissionReader,
  WorkspacePermissionSubject,
} from 'src/modules/permission/application/ports/workspace-permission-reader.port';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import { Repository } from 'typeorm';

@Injectable()
export class TypeOrmWorkspacePermissionReader implements WorkspacePermissionReader {
  constructor(
    @InjectRepository(WorkspaceMemberOrmEntity)
    private readonly workspaceMemberRepository: Repository<WorkspaceMemberOrmEntity>,
  ) {}

  async findMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspacePermissionSubject | null> {
    const membership = await this.workspaceMemberRepository.findOne({
      select: {
        workspaceId: true,
        userId: true,
        roleName: true,
      },
      where: {
        workspaceId,
        userId,
      },
    });

    return membership
      ? {
          workspaceId: membership.workspaceId,
          userId: membership.userId,
          role: membership.roleName,
        }
      : null;
  }
}
