import type { CreatePageBlockSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

export interface PagePresetDefinition {
  key: PagePreset;
  title: string;
  icon: string;
  blocks: CreatePageBlockSnapshotInput[];
}

type PresetBlock =
  | { type: PageBlockType.DIVIDER }
  | { type: PageBlockType.HEADER; text: string; level?: 1 | 2 | 3 }
  | { type: PageBlockType.TODO; text: string; checked?: boolean }
  | { type: PageBlockType.CALLOUT; text: string; icon?: string }
  | {
      type:
        | PageBlockType.TEXT
        | PageBlockType.QUOTE
        | PageBlockType.BULLETED_LIST
        | PageBlockType.NUMBERED_LIST;
      text: string;
    };

function toSnapshot(blocks: PresetBlock[]): CreatePageBlockSnapshotInput[] {
  return blocks.map((block, index) => {
    const base = {
      sourceId: `preset-${index}`,
      type: block.type,
      positionX: null,
      positionY: null,
      width: null,
      height: null,
      orderIndex: index,
    };

    switch (block.type) {
      case PageBlockType.DIVIDER:
        return base;
      case PageBlockType.HEADER:
        return {
          ...base,
          content: { text: block.text },
          styleConfig: { level: block.level ?? 2 },
        };
      case PageBlockType.TODO:
        return {
          ...base,
          content: { text: block.text, checked: block.checked ?? false },
        };
      case PageBlockType.CALLOUT:
        return {
          ...base,
          content: { text: block.text, icon: block.icon ?? '💡' },
          styleConfig: { tone: 'default' },
        };
      default:
        return { ...base, content: { text: block.text } };
    }
  });
}

const PRESET_SOURCES: Record<
  PagePreset,
  { title: string; icon: string; blocks: PresetBlock[] }
> = {
  [PagePreset.EMPTY]: { title: 'Empty', icon: '📄', blocks: [] },
  [PagePreset.GETTING_STARTED]: {
    title: 'Getting started',
    icon: '👋',
    blocks: [
      {
        type: PageBlockType.CALLOUT,
        text: 'Welcome to your personal workspace. Use this page to learn the basics, then delete it when you are done.',
      },
      { type: PageBlockType.HEADER, text: 'The basics' },
      {
        type: PageBlockType.TODO,
        text: 'Click anywhere and start typing',
      },
      {
        type: PageBlockType.TODO,
        text: 'Type "/" to insert headings, lists, callouts and more',
      },
      {
        type: PageBlockType.TODO,
        text: 'Create a new page from the sidebar',
      },
      {
        type: PageBlockType.TODO,
        text: 'Browse the template gallery for ready-made pages',
      },
    ],
  },
  [PagePreset.TODO_LIST]: {
    title: 'To-do list',
    icon: '✅',
    blocks: [
      { type: PageBlockType.HEADER, text: 'Today' },
      { type: PageBlockType.TODO, text: 'Plan the day' },
      { type: PageBlockType.TODO, text: 'Reply to important messages' },
      { type: PageBlockType.HEADER, text: 'Later' },
      { type: PageBlockType.TODO, text: 'Something to come back to' },
    ],
  },
  [PagePreset.JOURNAL]: {
    title: 'Journal',
    icon: '📔',
    blocks: [
      {
        type: PageBlockType.QUOTE,
        text: 'Write a few lines every day. Small notes add up.',
      },
      { type: PageBlockType.HEADER, text: 'What went well' },
      {
        type: PageBlockType.BULLETED_LIST,
        text: 'Finished something I put off',
      },
      { type: PageBlockType.HEADER, text: 'What I learned' },
      { type: PageBlockType.BULLETED_LIST, text: 'One new idea from today' },
    ],
  },
  [PagePreset.MEETING_NOTES]: {
    title: 'Meeting notes',
    icon: '🗓️',
    blocks: [
      { type: PageBlockType.HEADER, text: 'Agenda' },
      { type: PageBlockType.NUMBERED_LIST, text: 'Updates' },
      { type: PageBlockType.NUMBERED_LIST, text: 'Discussion' },
      { type: PageBlockType.HEADER, text: 'Action items' },
      { type: PageBlockType.TODO, text: 'Owner: task' },
    ],
  },
  [PagePreset.PROJECT_OVERVIEW]: {
    title: 'Project overview',
    icon: '🎯',
    blocks: [
      {
        type: PageBlockType.CALLOUT,
        text: 'One place for the goal, scope and timeline of your project.',
        icon: '📌',
      },
      { type: PageBlockType.HEADER, text: 'Goal' },
      {
        type: PageBlockType.TEXT,
        text: 'What does success look like?',
      },
      { type: PageBlockType.HEADER, text: 'Scope' },
      { type: PageBlockType.BULLETED_LIST, text: 'In scope' },
      { type: PageBlockType.BULLETED_LIST, text: 'Out of scope' },
      { type: PageBlockType.DIVIDER },
      { type: PageBlockType.HEADER, text: 'Milestones' },
      { type: PageBlockType.TODO, text: 'Kickoff' },
      { type: PageBlockType.TODO, text: 'First release' },
      { type: PageBlockType.TODO, text: 'Launch' },
    ],
  },
  [PagePreset.TASKS]: {
    title: 'Tasks',
    icon: '📋',
    blocks: [
      { type: PageBlockType.HEADER, text: 'To do' },
      { type: PageBlockType.TODO, text: 'Write the project brief' },
      { type: PageBlockType.TODO, text: 'Break the work into tasks' },
      { type: PageBlockType.HEADER, text: 'In progress' },
      { type: PageBlockType.TODO, text: 'Set up the project workspace' },
      { type: PageBlockType.HEADER, text: 'Done' },
      {
        type: PageBlockType.TODO,
        text: 'Create the workspace',
        checked: true,
      },
    ],
  },
  [PagePreset.TEAM_HOME]: {
    title: 'Team home',
    icon: '🏠',
    blocks: [
      {
        type: PageBlockType.CALLOUT,
        text: 'This is the home of your team. Keep the essentials here so everyone can find them.',
      },
      { type: PageBlockType.HEADER, text: 'Mission' },
      {
        type: PageBlockType.TEXT,
        text: 'Describe what your team does and why it matters.',
      },
      { type: PageBlockType.HEADER, text: 'Quick links' },
      { type: PageBlockType.BULLETED_LIST, text: 'Onboarding' },
      { type: PageBlockType.BULLETED_LIST, text: 'Meeting notes' },
      { type: PageBlockType.BULLETED_LIST, text: 'Team directory' },
    ],
  },
  [PagePreset.ONBOARDING]: {
    title: 'Onboarding',
    icon: '🚀',
    blocks: [
      { type: PageBlockType.HEADER, text: 'First week' },
      { type: PageBlockType.TODO, text: 'Meet your teammates' },
      { type: PageBlockType.TODO, text: 'Set up your accounts and tools' },
      { type: PageBlockType.TODO, text: 'Read the team home page' },
      { type: PageBlockType.HEADER, text: 'Good to know' },
      {
        type: PageBlockType.TEXT,
        text: 'Add the things every new teammate should know.',
      },
    ],
  },
};

export const PAGE_PRESET_OPTIONS: PagePreset[] = [
  PagePreset.EMPTY,
  PagePreset.TODO_LIST,
  PagePreset.MEETING_NOTES,
  PagePreset.JOURNAL,
  PagePreset.PROJECT_OVERVIEW,
  PagePreset.TASKS,
  PagePreset.ONBOARDING,
];

export function getPagePreset(key: PagePreset): PagePresetDefinition {
  const source = PRESET_SOURCES[key];

  return {
    key,
    title: source.title,
    icon: source.icon,
    blocks: toSnapshot(source.blocks),
  };
}
