import type { CreatePageBlockSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { WorkspaceStarter } from 'src/modules/workspace/domain/enums/workspace-starter.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

export interface WorkspaceStarterPage {
  title: string;
  icon: string;
  blocks: CreatePageBlockSnapshotInput[];
}

export interface WorkspaceStarterDefinition {
  key: WorkspaceStarter;
  title: string;
  description: string;
  icon: string;
  defaultName: string;
  pages: WorkspaceStarterPage[];
}

type StarterPageSource = {
  title: string;
  icon: string;
  blocks: StarterBlock[];
};

type StarterBlock =
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

function toSnapshot(blocks: StarterBlock[]): CreatePageBlockSnapshotInput[] {
  return blocks.map((block, index) => {
    const base = {
      sourceId: `starter-${index}`,
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

const PERSONAL_PAGES: StarterPageSource[] = [
  {
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
  {
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
  {
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
];

const TEAM_WIKI_PAGES: StarterPageSource[] = [
  {
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
  {
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
  {
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
];

const PROJECT_PLANNER_PAGES: StarterPageSource[] = [
  {
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
  {
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
];

function toPages(pages: StarterPageSource[]): WorkspaceStarterPage[] {
  return pages.map((page) => ({
    title: page.title,
    icon: page.icon,
    blocks: toSnapshot(page.blocks),
  }));
}

export const WORKSPACE_STARTERS: WorkspaceStarterDefinition[] = [
  {
    key: WorkspaceStarter.BLANK,
    title: 'Empty workspace',
    description: 'Start with a single blank page.',
    icon: '📄',
    defaultName: 'New workspace',
    pages: [],
  },
  {
    key: WorkspaceStarter.PERSONAL,
    title: 'Personal',
    description: 'Getting started guide, to-do list and journal.',
    icon: '🌱',
    defaultName: 'Personal',
    pages: toPages(PERSONAL_PAGES),
  },
  {
    key: WorkspaceStarter.TEAM_WIKI,
    title: 'Team wiki',
    description: 'Team home, onboarding checklist and meeting notes.',
    icon: '📚',
    defaultName: 'Team wiki',
    pages: toPages(TEAM_WIKI_PAGES),
  },
  {
    key: WorkspaceStarter.PROJECT_PLANNER,
    title: 'Project planner',
    description: 'Project overview with milestones and a task list.',
    icon: '🎯',
    defaultName: 'Project planner',
    pages: toPages(PROJECT_PLANNER_PAGES),
  },
];

export function getWorkspaceStarter(
  starter: WorkspaceStarter,
): WorkspaceStarterDefinition {
  const definition = WORKSPACE_STARTERS.find((item) => item.key === starter);
  if (!definition) throw new Error(`Unknown workspace starter: ${starter}`);
  return definition;
}
