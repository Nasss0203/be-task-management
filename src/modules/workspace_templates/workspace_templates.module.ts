import { Module } from '@nestjs/common';
import { WorkspaceTemplatesService } from './workspace_templates.service';
import { WorkspaceTemplatesController } from './workspace_templates.controller';

@Module({
  controllers: [WorkspaceTemplatesController],
  providers: [WorkspaceTemplatesService],
})
export class WorkspaceTemplatesModule {}
