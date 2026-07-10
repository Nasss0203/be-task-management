import {
  validateAiWorkspaceDraftOutput,
  workspaceDraftToOutputData,
} from './ai-workspace-draft.validator';

describe('AiWorkspaceDraftValidator', () => {
  describe('validateAiWorkspaceDraftOutput', () => {
    it('returns success: true and data when input is valid', () => {
      const valid = {
        name: 'My Custom Workspace ',
        slug: 'my-custom-workspace-123',
      };

      const result = validateAiWorkspaceDraftOutput(valid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Custom Workspace');
        expect(result.data.slug).toBe('my-custom-workspace-123');
      }
    });

    it('returns success: false when input is not an object', () => {
      const result = validateAiWorkspaceDraftOutput('not-an-object');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain(
          'Workspace draft output must be an object',
        );
      }
    });

    it('returns errors when name is invalid', () => {
      const invalid = {
        name: 'a', // too short
        slug: 'valid-slug',
      };

      const result = validateAiWorkspaceDraftOutput(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) => e.includes('name must be between')),
        ).toBe(true);
      }
    });

    it('returns errors when slug format is invalid', () => {
      const invalid = {
        name: 'Valid Name',
        slug: 'Invalid-Slug_with_Spaces',
      };

      const result = validateAiWorkspaceDraftOutput(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) =>
            e.includes('slug must contain only lowercase'),
          ),
        ).toBe(true);
      }
    });

    it('returns errors when slug has consecutive dashes', () => {
      const invalid = {
        name: 'Valid Name',
        slug: 'invalid--slug',
      };

      const result = validateAiWorkspaceDraftOutput(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) =>
            e.includes('slug must contain only lowercase'),
          ),
        ).toBe(true);
      }
    });
  });

  describe('workspaceDraftToOutputData', () => {
    it('maps workspace draft to record output', () => {
      const draft = {
        name: 'Test Workspace',
        slug: 'test-workspace',
      };

      const output = workspaceDraftToOutputData(draft);
      expect(output).toEqual({
        name: 'Test Workspace',
        slug: 'test-workspace',
      });
    });
  });
});
