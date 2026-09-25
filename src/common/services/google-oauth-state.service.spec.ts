import { UnauthorizedException } from '@nestjs/common';
import {
  GOOGLE_OAUTH_STATE_BYTE_LENGTH,
  GOOGLE_OAUTH_STATE_ENCODED_LENGTH,
} from 'src/common/constants/google-oauth-state.constant';
import { GoogleOAuthStateService } from './google-oauth-state.service';

describe('GoogleOAuthStateService', () => {
  const service = new GoogleOAuthStateService();

  describe('generateState', () => {
    it('generates a base64url state with 32 bytes of entropy', () => {
      const state = service.generateState();

      expect(state).toHaveLength(GOOGLE_OAUTH_STATE_ENCODED_LENGTH);
      expect(state).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(Buffer.from(state, 'base64url')).toHaveLength(
        GOOGLE_OAUTH_STATE_BYTE_LENGTH,
      );
    });

    it('generates a different state for each call', () => {
      expect(service.generateState()).not.toBe(service.generateState());
    });
  });

  describe('assertValid', () => {
    it('accepts matching valid states', () => {
      const state = service.generateState();

      expect(() => service.assertValid(state, state)).not.toThrow();
    });

    it.each([
      ['missing received state', undefined, service.generateState()],
      ['missing stored state', service.generateState(), undefined],
      ['array state', [service.generateState()], service.generateState()],
      ['empty state', '', service.generateState()],
      ['different content', service.generateState(), service.generateState()],
      [
        'different length',
        Buffer.alloc(31, 1).toString('base64url'),
        service.generateState(),
      ],
      ['invalid format', '!'.repeat(43), service.generateState()],
      [
        'non-canonical base64url',
        `${Buffer.alloc(32, 1).toString('base64url').slice(0, -1)}F`,
        Buffer.alloc(32, 1).toString('base64url'),
      ],
    ])('rejects %s', (_caseName, receivedState, storedState) => {
      expect(() => service.assertValid(receivedState, storedState)).toThrow(
        UnauthorizedException,
      );
    });
  });
});
