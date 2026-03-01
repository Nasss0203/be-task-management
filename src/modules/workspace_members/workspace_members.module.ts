import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateWorkspaceMemberApplicationImpl } from './applications/create.workspace-member.application';
import { WorkspaceMembersController } from './controller/workspace_members.controller';
import { WorkspaceMember } from './domain/entities/workspace_member.entity';
import { WORKSPACE_MEMBER_TYPES } from './interfaces/types';
import { WorkspaceMemberRepositoryImpl } from './repositories/workspace-member.repository';
import { CreateWorkspaceMemberServiceImpl } from './services/create.workspace-member.service';
import { WorkspaceMembersService } from './workspace_members.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceMember])],
  controllers: [WorkspaceMembersController],
  providers: [
    WorkspaceMembersService,
    {
      provide:
        WORKSPACE_MEMBER_TYPES.applications.CreateWorkspaceMemberApplication,
      useClass: CreateWorkspaceMemberApplicationImpl,
    },
    {
      provide: WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository,
      useClass: WorkspaceMemberRepositoryImpl,
    },
    {
      provide: WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService,
      useClass: CreateWorkspaceMemberServiceImpl,
    },
  ],
  exports: [WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService],
})
export class WorkspaceMembersModule {}
