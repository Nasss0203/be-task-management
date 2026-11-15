import { isUUID } from 'class-validator';

import {
  SLACK_REPLY_ACTION_ID,
  SLACK_REPLY_BLOCK_ID,
  SLACK_REPLY_CALLBACK_ID,
  SLACK_REPLY_INPUT_ID,
} from '../../../application/ports/slack-client.port';

type RawInteraction = {
  type?: unknown;
  trigger_id?: unknown;
  team?: { id?: unknown } | null;
  user?: { id?: unknown; team_id?: unknown };
  actions?: { action_id?: unknown; value?: unknown }[];
  view?: {
    id?: unknown;
    callback_id?: unknown;
    private_metadata?: unknown;
    state?: {
      values?: Record<string, Record<string, { value?: unknown }>>;
    };
  };
};

export type SlackInteraction =
  | {
      kind: 'open-reply';
      slackTeamId: string;
      slackUserId: string;
      triggerId: string;
      commentId: string;
    }
  | {
      kind: 'submit-reply';
      slackTeamId: string;
      slackUserId: string;
      viewId: string;
      commentId: string;
      body: string;
    };

const text = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

const uuid = (value: unknown): string | null =>
  typeof value === 'string' && isUUID(value) ? value : null;

const parseJson = (payload: unknown): RawInteraction | null => {
  if (typeof payload !== 'string') {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(payload);
    return parsed && typeof parsed === 'object'
      ? (parsed as RawInteraction)
      : null;
  } catch {
    return null;
  }
};

export const parseSlackInteraction = (
  payload: unknown,
): SlackInteraction | null => {
  const interaction = parseJson(payload);
  const slackTeamId = text(interaction?.team?.id ?? interaction?.user?.team_id);
  const slackUserId = text(interaction?.user?.id);

  if (!interaction || !slackTeamId || !slackUserId) {
    return null;
  }

  if (interaction.type === 'block_actions') {
    const action = Array.isArray(interaction.actions)
      ? interaction.actions.find(
          (item) => item?.action_id === SLACK_REPLY_ACTION_ID,
        )
      : undefined;
    const triggerId = text(interaction.trigger_id);
    const commentId = uuid(action?.value);

    return triggerId && commentId
      ? { kind: 'open-reply', slackTeamId, slackUserId, triggerId, commentId }
      : null;
  }

  if (
    interaction.type === 'view_submission' &&
    interaction.view?.callback_id === SLACK_REPLY_CALLBACK_ID
  ) {
    const viewId = text(interaction.view.id);
    const commentId = uuid(interaction.view.private_metadata);
    const body =
      interaction.view.state?.values?.[SLACK_REPLY_BLOCK_ID]?.[
        SLACK_REPLY_INPUT_ID
      ]?.value;

    return viewId && commentId
      ? {
          kind: 'submit-reply',
          slackTeamId,
          slackUserId,
          viewId,
          commentId,
          body: typeof body === 'string' ? body : '',
        }
      : null;
  }

  return null;
};
