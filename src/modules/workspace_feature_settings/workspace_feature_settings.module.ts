import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateWorkspaceFeatureSettingApplicationImpl } from './applications/create.workspace_feature_setting.application';
import { DeleteWorkspaceFeatureSettingApplicationImpl } from './applications/delete.workspace_feature_setting.application';
import { FindWorkspaceFeatureSettingApplicationImpl } from './applications/find.workspace_feature_setting.application';
import { UpdateWorkspaceFeatureSettingApplicationImpl } from './applications/update.workspace_feature_setting.application';
import { WorkspaceFeatureAccessApplicationImpl } from './applications/workspace_feature_access.application';
import { WorkspaceFeaturesController } from './controller/workspace_features.controller';
import { WorkspaceFeatureSettingsController } from './controller/workspace_feature_settings.controller';
import { WorkspaceFeatureSetting } from './domain/entities/workspace_feature_setting.entity';
import { WORKSPACE_FEATURE_SETTING_TYPES } from './interfaces/types';
import { CreateWorkspaceFeatureSettingRepositoryImpl } from './repositories/create.workspace_feature_setting.repository';
import { DeleteWorkspaceFeatureSettingRepositoryImpl } from './repositories/delete.workspace_feature_setting.repository';
import { FindWorkspaceFeatureSettingRepositoryImpl } from './repositories/find.workspace_feature_setting.repository';
import { UpdateWorkspaceFeatureSettingRepositoryImpl } from './repositories/update.workspace_feature_setting.repository';
import { WorkspaceFeatureAccessRepositoryImpl } from './repositories/workspace_feature_access.repository';
import { CreateWorkspaceFeatureSettingServiceImpl } from './services/create.workspace_feature_setting.service';
import { DeleteWorkspaceFeatureSettingServiceImpl } from './services/delete.workspace_feature_setting.service';
import { FindWorkspaceFeatureSettingServiceImpl } from './services/find.workspace_feature_setting.service';
import { UpdateWorkspaceFeatureSettingServiceImpl } from './services/update.workspace_feature_setting.service';
import { WorkspaceFeatureAccessServiceImpl } from './services/workspace_feature_access.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceFeatureSetting])],
  controllers: [WorkspaceFeatureSettingsController, WorkspaceFeaturesController],
  providers: [
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.repositories
          .CreateWorkspaceFeatureSettingRepository,
      useClass: CreateWorkspaceFeatureSettingRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.repositories
          .FindWorkspaceFeatureSettingRepository,
      useClass: FindWorkspaceFeatureSettingRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.repositories
          .UpdateWorkspaceFeatureSettingRepository,
      useClass: UpdateWorkspaceFeatureSettingRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.repositories
          .DeleteWorkspaceFeatureSettingRepository,
      useClass: DeleteWorkspaceFeatureSettingRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.repositories
          .WorkspaceFeatureAccessRepository,
      useClass: WorkspaceFeatureAccessRepositoryImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.services
          .CreateWorkspaceFeatureSettingService,
      useClass: CreateWorkspaceFeatureSettingServiceImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.services
          .FindWorkspaceFeatureSettingService,
      useClass: FindWorkspaceFeatureSettingServiceImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.services
          .UpdateWorkspaceFeatureSettingService,
      useClass: UpdateWorkspaceFeatureSettingServiceImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.services
          .DeleteWorkspaceFeatureSettingService,
      useClass: DeleteWorkspaceFeatureSettingServiceImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.services.WorkspaceFeatureAccessService,
      useClass: WorkspaceFeatureAccessServiceImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.applications
          .CreateWorkspaceFeatureSettingApplication,
      useClass: CreateWorkspaceFeatureSettingApplicationImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.applications
          .FindWorkspaceFeatureSettingApplication,
      useClass: FindWorkspaceFeatureSettingApplicationImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.applications
          .UpdateWorkspaceFeatureSettingApplication,
      useClass: UpdateWorkspaceFeatureSettingApplicationImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.applications
          .DeleteWorkspaceFeatureSettingApplication,
      useClass: DeleteWorkspaceFeatureSettingApplicationImpl,
    },
    {
      provide:
        WORKSPACE_FEATURE_SETTING_TYPES.applications
          .WorkspaceFeatureAccessApplication,
      useClass: WorkspaceFeatureAccessApplicationImpl,
    },
  ],
  exports: [
    WORKSPACE_FEATURE_SETTING_TYPES.services.CreateWorkspaceFeatureSettingService,
    WORKSPACE_FEATURE_SETTING_TYPES.services.FindWorkspaceFeatureSettingService,
    WORKSPACE_FEATURE_SETTING_TYPES.services.UpdateWorkspaceFeatureSettingService,
    WORKSPACE_FEATURE_SETTING_TYPES.services.DeleteWorkspaceFeatureSettingService,
    WORKSPACE_FEATURE_SETTING_TYPES.services.WorkspaceFeatureAccessService,
  ],
})
export class WorkspaceFeatureSettingsModule {}
