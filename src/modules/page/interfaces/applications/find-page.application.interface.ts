import { PageResponseDto } from '../../dto/response/page.response.dto';

export interface FindPageApplication {
  findPageByWorkspaceId(workspaceId: string): Promise<PageResponseDto | null>;
  findDeletedPages(workspaceId: string): Promise<PageResponseDto[]>;
}
