import { PartialType } from '@nestjs/swagger';
import { CreateWorkspaceFeatureSettingDto } from './create-workspace_feature_setting.dto';

export class UpdateWorkspaceFeatureSettingDto extends PartialType(CreateWorkspaceFeatureSettingDto) {}
