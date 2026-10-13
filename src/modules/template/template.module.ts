import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/modules/database/database.module';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { ContentModule } from '../content/content.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { PermissionModule } from '../permission/permission.module';
import { UseTemplateHandler } from './application/commands/page-template/use-template/use-template.handler';
import { InternalTemplateRenderController } from './presentation/http/controllers/internal-template-render.controller';
import { TemplateController } from './presentation/http/controllers/template.controller';
import { TemplateContentModule } from './template-content.module';
@Module({
  imports: [
    TemplateContentModule,
    MarketplaceModule,
    ContentModule,
    DatabaseModule,
    PermissionModule,
  ],
  providers: [
    {
      provide: TEMPLATE_TYPES.applications.UseTemplateHandler,
      useClass: UseTemplateHandler,
    },
  ],
  controllers: [TemplateController, InternalTemplateRenderController],
  exports: [TemplateContentModule],
})
export class TemplateModule {}
