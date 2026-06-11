import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceTemplate } from 'src/modules/workspace_templates/domain/entities/workspace_template.entity';
import { WorkspaceTemplatesController } from './controller/workspace_templates.controller';
import { WORKSPACE_TEMPLATE_TYPES } from './interfaces/types';
import { WorkspaceTemplatesRepositoryImpl } from './repositories/workspace_templates.repository';
import { WorkspaceTemplatesServiceImpl } from './services/workspace_templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceTemplate])],
  controllers: [WorkspaceTemplatesController],
  providers: [
    {
      provide: WORKSPACE_TEMPLATE_TYPES.repositories.WorkspaceTemplatesRepository,
      useClass: WorkspaceTemplatesRepositoryImpl,
    },
    {
      provide: WORKSPACE_TEMPLATE_TYPES.services.WorkspaceTemplatesService,
      useClass: WorkspaceTemplatesServiceImpl,
    },
  ],
  exports: [WORKSPACE_TEMPLATE_TYPES.services.WorkspaceTemplatesService],
})
export class WorkspaceTemplatesModule {}

