import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { ActivityModule } from '../activity/activity.module';
import { AddWorkspaceMemberHandler } from './application/commands/add-workspace-member/add-workspace-member.handler';
import { DeleteWorkspaceMemberHandler } from './application/commands/delete-workspace-member/delete-workspace-member.handler';
import { UpdateWorkspaceMemberRoleHandler } from './application/commands/update-workspace-member-role/update-workspace-member-role.handler';
import { ListWorkspaceMembersHandler } from './application/queries/list-workspace-members/list-workspace-members.handler';
import { WorkspaceMemberController } from './controller/workspace-member.controller';
import { WorkspaceMember } from './domain/entities/workspace-member.entity';
import { WORKSPACE_MEMBER_TYPES } from './interfaces/types';
import { FindWorkspaceMemberRepositoryImpl } from './repositories/find-workspace-member.repository';
import { WorkspaceMemberRepositoryImpl } from './repositories/workspace-member.repository';
import { AddWorkspaceMemberServiceImpl } from './services/add-workspace-member.service';
import { CreateWorkspaceMemberServiceImpl } from './services/create-workspace-member.service';
import { FindWorkspaceMemberServiceImpl } from './services/find-workspace-member.service';
import { UpdateWorkspaceMemberServiceImpl } from './services/update-workspace-member.service';
import { DeleteWorkspaceMemberServiceImpl } from './services/delete-workspace-member.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceMember]), ActivityModule],
  controllers: [WorkspaceMemberController],
  providers: [
    // Handler
    AddWorkspaceMemberHandler,
    UpdateWorkspaceMemberRoleHandler,
    DeleteWorkspaceMemberHandler,
    ListWorkspaceMembersHandler,
    //Repository
    {
      provide: WORKSPACE_MEMBER_TYPES.repositories.WorkspaceMemberRepository,
      useClass: WorkspaceMemberRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_MEMBER_TYPES.repositories.FindWorkspaceMemberRepository,
      useClass: FindWorkspaceMemberRepositoryImpl,
    },
    //Service
    {
      provide: WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService,
      useClass: CreateWorkspaceMemberServiceImpl,
    },
    {
      provide: WORKSPACE_MEMBER_TYPES.services.AddWorkspaceMemberService,
      useClass: AddWorkspaceMemberServiceImpl,
    },
    {
      provide: WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService,
      useClass: FindWorkspaceMemberServiceImpl,
    },
    {
      provide: WORKSPACE_MEMBER_TYPES.services.UpdateWorkspaceMemberService,
      useClass: UpdateWorkspaceMemberServiceImpl,
    },
    {
      provide: WORKSPACE_MEMBER_TYPES.services.DeleteWorkspaceMemberService,
      useClass: DeleteWorkspaceMemberServiceImpl,
    },
    {
      provide: WORKSPACE_MEMBER_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService,
    WORKSPACE_MEMBER_TYPES.services.FindWorkspaceMemberService,
  ],
})
export class WorkspaceMemberModule {}
