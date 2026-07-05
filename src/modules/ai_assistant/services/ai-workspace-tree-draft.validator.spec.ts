import {
  validateAiWorkspaceTreeDraftOutput,
  workspaceTreeDraftToOutputData,
} from './ai-workspace-tree-draft.validator';

describe('AiWorkspaceTreeDraftValidator', () => {
  describe('validateAiWorkspaceTreeDraftOutput', () => {
    it('returns success: true and data when input is valid', () => {
      const valid = {
        workspaces: [
          {
            name: 'Workspace A',
            slug: 'workspace-a',
            projects: [
              {
                name: 'Project 1',
                key: 'PROJ',
                visibility: 'INTERNAL',
                description: 'This is a description of project 1',
                tasks: [
                  {
                    title: 'Task A',
                    description: 'This is task A description',
                    priority: 'HIGH',
                    estimatedHours: 4,
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = validateAiWorkspaceTreeDraftOutput(valid);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workspaces).toHaveLength(1);
        expect(result.data.workspaces[0].name).toBe('Workspace A');
        expect(result.data.workspaces[0].projects[0].tasks[0].title).toBe('Task A');
      }
    });

    it('returns success: false when total entities exceeds 30', () => {
      // 1 Workspace, 2 Projects, each Project has 15 Tasks => Total = 1 + 2 + 30 = 33 entities (> 30)
      const tasks: any[] = [];
      for (let i = 0; i < 15; i++) {
        tasks.push({
          title: `Task ${i}`,
          description: `This is task description ${i}`,
          priority: 'MEDIUM',
          estimatedHours: 2,
        });
      }

      const invalid = {
        workspaces: [
          {
            name: 'Workspace Huge',
            slug: 'workspace-huge',
            projects: [
              {
                name: 'Project A',
                key: 'PROJA',
                visibility: 'PRIVATE',
                description: 'Project description for project A',
                tasks,
              },
              {
                name: 'Project B',
                key: 'PROJB',
                visibility: 'PRIVATE',
                description: 'Project description for project B',
                tasks,
              },
            ],
          },
        ],
      };

      const result = validateAiWorkspaceTreeDraftOutput(invalid);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) => e.includes('exceeds limit of 30')),
        ).toBe(true);
      }
    });

    it('returns success: false when input structure is invalid', () => {
      const invalid = {
        workspaces: 'not-an-array',
      };

      const result = validateAiWorkspaceTreeDraftOutput(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('workspaceTreeDraftToOutputData', () => {
    it('maps workspace tree draft data correctly', () => {
      const draft = {
        workspaces: [
          {
            name: 'Workspace A',
            slug: 'workspace-a',
            projects: [
              {
                name: 'Project 1',
                key: 'PROJ',
                visibility: 'INTERNAL' as const,
                description: 'Project 1 desc',
                tasks: [
                  {
                    title: 'Task A',
                    description: 'Task A desc',
                    priority: 'HIGH' as const,
                    estimatedHours: 4,
                  },
                ],
              },
            ],
          },
        ],
      };

      const output = workspaceTreeDraftToOutputData(draft);
      expect(output).toEqual({
        workspaces: [
          {
            name: 'Workspace A',
            slug: 'workspace-a',
            projects: [
              {
                name: 'Project 1',
                key: 'PROJ',
                visibility: 'INTERNAL',
                description: 'Project 1 desc',
                tasks: [
                  {
                    title: 'Task A',
                    description: 'Task A desc',
                    priority: 'HIGH',
                    estimatedHours: 4,
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });
});
