import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function rethrowInvitationPendingUniqueConflict(error: unknown): never {
  if (error instanceof QueryFailedError) {
    const driverError = error.driverError as { code?: string; constraint?: string };
    if (driverError.code === '23505' && driverError.constraint === 'UQ_teamspace_invitations_pending') {
      throw new ConflictException('A pending teamspace invitation already exists');
    }
  }
  throw error;
}
