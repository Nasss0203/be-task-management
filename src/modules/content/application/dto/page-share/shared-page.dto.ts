import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

export class SharedPageDto {
  id: string;

  workspace_id: string;

  teamspace_id: string | null;

  parent_page_id: string | null;

  title: string;

  slug: string | null;

  icon: string | null;

  cover_url: string | null;

  accessLevel: ResourceAccessLevel;
}
