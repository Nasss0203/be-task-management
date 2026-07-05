import {
  validateAiProjectDraftOutput,
  projectDraftToOutputData,
} from './ai-project-draft.validator';

describe('AiProjectDraftValidator', () => {
  describe('validateAiProjectDraftOutput', () => {
    it('returns success: true and data when input is valid', () => {
      const valid = {
        name: 'My Awesome Project',
        key: 'proj', // should be trimmed and uppercase
        visibility: 'INTERNAL',
        description: 'This is a description that has enough characters.',
      };

      const result = validateAiProjectDraftOutput(valid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Awesome Project');
        expect(result.data.key).toBe('PROJ'); // auto-capitalized by validator
        expect(result.data.visibility).toBe('INTERNAL');
        expect(result.data.description).toBe(
          'This is a description that has enough characters.',
        );
      }
    });

    it('returns success: false when input is not an object', () => {
      const result = validateAiProjectDraftOutput('not-an-object');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain(
          'Project draft output must be an object',
        );
      }
    });

    it('returns errors when key format is invalid', () => {
      const invalid = {
        name: 'Valid Name',
        key: '1PROJ', // must start with a letter
        visibility: 'PRIVATE',
        description: 'This is a description that has enough characters.',
      };

      const result = validateAiProjectDraftOutput(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) => e.includes('key must start with a letter')),
        ).toBe(true);
      }
    });

    it('returns errors when visibility is invalid', () => {
      const invalid = {
        name: 'Valid Name',
        key: 'PROJ',
        visibility: 'PUBLIC', // invalid
        description: 'This is a description that has enough characters.',
      };

      const result = validateAiProjectDraftOutput(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) => e.includes('visibility must be PRIVATE')),
        ).toBe(true);
      }
    });

    it('returns errors when description is too short', () => {
      const invalid = {
        name: 'Valid Name',
        key: 'PROJ',
        visibility: 'PRIVATE',
        description: 'short', // < 10 chars
      };

      const result = validateAiProjectDraftOutput(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) => e.includes('description must be between')),
        ).toBe(true);
      }
    });
  });

  describe('projectDraftToOutputData', () => {
    it('maps project draft to record output', () => {
      const draft = {
        name: 'Test Project',
        key: 'TEST',
        visibility: 'PRIVATE' as const,
        description: 'Test Project Description',
      };

      const output = projectDraftToOutputData(draft);
      expect(output).toEqual({
        name: 'Test Project',
        key: 'TEST',
        visibility: 'PRIVATE',
        description: 'Test Project Description',
      });
    });
  });
});
