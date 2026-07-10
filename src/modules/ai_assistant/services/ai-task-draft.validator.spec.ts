import { validateAiTaskDraftOutput } from './ai-task-draft.validator';

describe('validateAiTaskDraftOutput', () => {
  const validTask = {
    title: 'Tao man hinh dang nhap',
    description: 'Xay dung man hinh dang nhap cho nguoi dung trong he thong.',
    priority: 'HIGH',
    estimatedHours: 8,
    subtasks: [
      {
        title: 'Tao form dang nhap',
        description: 'Tao form gom email, password va nut submit.',
        estimatedHours: 3,
      },
    ],
    acceptanceCriteria: [
      'Nguoi dung dang nhap thanh cong voi thong tin hop le',
    ],
    risks: ['Thieu thong tin xu ly loi tu API'],
  };

  const validDraft = {
    tasks: [validTask],
  };

  it('validates a valid task draft list', () => {
    const result = validateAiTaskDraftOutput(validDraft);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tasks).toHaveLength(1);
      expect(result.data.tasks[0].title).toBe('Tao man hinh dang nhap');
    }
  });

  it('rejects forbidden generated identifiers and assignee fields', () => {
    const result = validateAiTaskDraftOutput({
      tasks: [
        {
          ...validTask,
          workspaceId: 'workspace-1',
          assignee: 'user-1',
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.join(' ')).toContain('workspaceId');
      expect(result.errors.join(' ')).toContain('assignee');
    }
  });

  it('rejects invalid schema values', () => {
    const result = validateAiTaskDraftOutput({
      tasks: [
        {
          ...validTask,
          title: 'No',
          priority: 'BLOCKER',
          estimatedHours: 0,
          subtasks: [],
          acceptanceCriteria: [],
          risks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
