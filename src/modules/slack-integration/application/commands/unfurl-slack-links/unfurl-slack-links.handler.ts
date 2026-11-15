import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';

import { resolveFrontendOrigin } from 'src/common/config/frontend-origin.config';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { WorkspaceRepository } from 'src/modules/workspace/domain/repositories/workspace.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { TokenCipherService } from 'src/shared/security/token-cipher.service';

import {
  SlackConnectionError,
  type SlackConnectionRepository,
} from '../../../domain/repositories/slack-connection.repository';
import { SLACK_INTEGRATION_TYPES } from '../../../slack-integration.types';
import {
  SlackAuthError,
  type SlackClient,
  type SlackUnfurl,
} from '../../ports/slack-client.port';
import { UnfurlSlackLinksCommand } from './unfurl-slack-links.command';

export const SLACK_UNFURL_LINK_LIMIT = 5;

const PAGE_PATH = /^\/page\/([^/]+)(?:\/row\/[^/]+)?\/?$/;

const escapeSlackText = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const titleOf = (page: Page) => page.getTitle() || 'Untitled';

@Injectable()
export class UnfurlSlackLinksHandler {
  constructor(
    @Inject(SLACK_INTEGRATION_TYPES.repositories.SlackConnectionRepository)
    private readonly connectionRepository: SlackConnectionRepository,

    @Inject(SLACK_INTEGRATION_TYPES.ports.SlackClient)
    private readonly client: SlackClient,

    private readonly tokenCipher: TokenCipherService,

    private readonly configService: ConfigService,

    private readonly authorization: AuthorizationService,

    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaces: WorkspaceRepository,

    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pages: PageRepository,
  ) {}

  async execute(command: UnfurlSlackLinksCommand): Promise<void> {
    const connection = await this.connectionRepository.findBySlackUser(
      command.slackTeamId,
      command.slackUserId,
    );

    if (!connection || connection.lastError) {
      return;
    }

    const links = this.pageLinks(command.urls);
    const previews = await Promise.all(
      links.map(async ({ url, pageId }) => {
        const preview = await this.previewOf(pageId, connection.userId);
        return preview ? ([url, preview] as const) : null;
      }),
    );
    const unfurls = Object.fromEntries(
      previews.filter((item) => item !== null),
    );

    if (!Object.keys(unfurls).length) {
      return;
    }

    try {
      await this.client.unfurlLinks(
        this.tokenCipher.decrypt(connection.botTokenEncrypted),
        command.target,
        unfurls,
      );
    } catch (error) {
      if (error instanceof SlackAuthError) {
        return this.connectionRepository.markError(
          connection.id,
          SlackConnectionError.ACCESS_REVOKED,
        );
      }
      throw error;
    }
  }

  private pageLinks(urls: string[]) {
    const origin = new URL(resolveFrontendOrigin(this.configService)).origin;
    const links = new Map<string, string>();

    for (const url of urls) {
      if (!URL.canParse(url)) {
        continue;
      }
      const parsed = new URL(url);
      const pageId = PAGE_PATH.exec(parsed.pathname)?.[1];

      if (parsed.origin === origin && pageId && isUUID(pageId)) {
        links.set(url, pageId);
      }
    }

    return [...links]
      .slice(0, SLACK_UNFURL_LINK_LIMIT)
      .map(([url, pageId]) => ({ url, pageId }));
  }

  private async previewOf(
    pageId: string,
    userId: string,
  ): Promise<SlackUnfurl | null> {
    const page = await this.readablePage(pageId, userId);

    if (!page) {
      return null;
    }

    const parentId = page.getParentPageId();
    const [workspace, parent] = await Promise.all([
      this.workspaces.findById(page.getWorkspaceId()),
      parentId ? this.readablePage(parentId, userId) : null,
    ]);
    const path = [workspace?.getName(), parent && titleOf(parent)]
      .filter(Boolean)
      .join(' › ');
    const title = `*${escapeSlackText(titleOf(page))}*`;

    return {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: path ? `${title}\n${escapeSlackText(path)}` : title,
          },
        },
      ],
    };
  }

  private async readablePage(pageId: string, userId: string) {
    const page = await this.pages.findById(pageId);

    if (!page || page.getDeletedAt()) {
      return null;
    }

    const allowed = await this.authorization.authorize({
      userId,
      permissions: [PERMISSIONS.PAGE_READ],
      target: { type: 'page', id: pageId },
    });

    return allowed ? page : null;
  }
}
