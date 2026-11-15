import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { SearchPagesHandler } from 'src/modules/content/application/queries/page/search-pages/search-pages.handler';
import { SearchPagesQuery } from 'src/modules/content/application/queries/page/search-pages/search-pages.query';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import type { SlackConnectionRepository } from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import { SearchSlackPagesQuery } from './search-slack-pages.query';

export const SLACK_SEARCH_WORKSPACE_LIMIT = 5;
export const SLACK_SEARCH_RESULT_LIMIT = 10;

export type SlackCommandResponse = {
  response_type: 'ephemeral';
  text: string;
};

const escapeSlackText = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const reply = (text: string): SlackCommandResponse => ({
  response_type: 'ephemeral',
  text,
});

@Injectable()
export class SearchSlackPagesHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaces: WorkspaceRepository,

    @Inject(CONTENT_TYPES.applications.SearchPagesHandler)
    private readonly searchPages: SearchPagesHandler,

    private readonly configService: ConfigService,
  ) {}

  async execute(query: SearchSlackPagesQuery): Promise<SlackCommandResponse> {
    const origin = resolveFrontendOrigin(this.configService);
    const connection = await this.connectionRepository.findBySlackUser(
      query.slackTeamId,
      query.slackUserId,
    );

    if (!connection || connection.lastError) {
      return reply(
        `Connect Slack in Taskmanly first (Settings → Connections): <${origin}/dashboard|Open Taskmanly>`,
      );
    }

    const text = query.text.trim();

    if (!text || text.toLowerCase() === 'help') {
      return reply(
        'Use `/taskmanly <words>` to find pages you can open in Taskmanly.',
      );
    }

    const workspaces = (
      await this.workspaces.findByUserId(connection.userId)
    ).slice(0, SLACK_SEARCH_WORKSPACE_LIMIT);

    const results = await Promise.all(
      workspaces.map(async (workspace) => {
        const pages = await this.searchPages.execute(
          new SearchPagesQuery(workspace.getId(), connection.userId, text),
        );
        return pages.map((page) => ({
          ...page,
          workspace: workspace.getName(),
        }));
      }),
    );

    const pages = results
      .flat()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, SLACK_SEARCH_RESULT_LIMIT);

    if (pages.length === 0) {
      return reply(`No pages found for "${escapeSlackText(text)}".`);
    }

    const lines = pages.map(
      (page) =>
        `• <${origin}/page/${page.pageId}|${escapeSlackText(page.title || 'Untitled')}> · ${escapeSlackText(page.workspace)}`,
    );

    return reply(
      [`Pages matching "${escapeSlackText(text)}":`, ...lines].join('\n'),
    );
  }
}
