import { Injectable } from '@nestjs/common';
import { WORKSPACE_STARTERS } from 'src/modules/workspace/application/services/workspace-starters';

@Injectable()
export class ListWorkspaceStartersHandler {
  execute() {
    return WORKSPACE_STARTERS.map((starter) => ({
      key: starter.key,
      title: starter.title,
      description: starter.description,
      icon: starter.icon,
      defaultName: starter.defaultName,
      pages: starter.pages.map((page) => ({
        title: page.title,
        icon: page.icon,
        blocks: page.blocks.map((block) => ({
          id: block.sourceId,
          type: block.type,
          content: block.content ?? null,
          style_config: block.styleConfig ?? null,
        })),
      })),
    }));
  }
}
