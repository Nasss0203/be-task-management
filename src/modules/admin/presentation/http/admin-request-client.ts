import type { Request } from 'express';

import type { AdminRequestClient } from '../../domain/audit/admin-action';

export function adminRequestClientOf(
  req: Pick<Request, 'ip' | 'headers'>,
): AdminRequestClient {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}
