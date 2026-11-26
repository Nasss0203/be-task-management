import type { Request } from 'express';

import type { AuthClientInfo } from '../../application/services/issue-auth-token.service';

const MAX_USER_AGENT_LENGTH = 255;

export function authClientOf(
  req: Pick<Request, 'ip' | 'headers'>,
): AuthClientInfo {
  const userAgent = req.headers['user-agent'];

  return {
    ipAddress: req.ip ?? null,
    userAgent: userAgent ? userAgent.slice(0, MAX_USER_AGENT_LENGTH) : null,
  };
}
