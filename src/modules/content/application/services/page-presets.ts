import type {
  CreatePageBlockSnapshotInput,
  PresetDatabaseDefinition,
  PresetDatabaseValue,
} from 'src/modules/content/application/ports/content-page-provisioning.port';
import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';
import type {
  ProvisionDatabaseSnapshot,
  ProvisionDatabaseRowValueSnapshot,
} from 'src/modules/database/application/ports/database-provisioning.port';
import type { RowValueData } from 'src/modules/database/domain/aggregates/row/row-value.type';
import {
  DEFAULT_PRIORITY_OPTIONS,
  DEFAULT_STATUS_OPTIONS,
} from 'src/modules/database/domain/constants/default-property-options.constant';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

export interface PagePresetDefinition {
  key: PagePreset;
  title: string;
  icon: string;
  blocks: CreatePageBlockSnapshotInput[];
  database: PresetDatabaseDefinition | null;
}

const SINGLE_OPTION_TYPES = [PropertyType.SELECT, PropertyType.STATUS];

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildPresetDatabaseSnapshot(
  definition: PresetDatabaseDefinition,
  today: string,
): ProvisionDatabaseSnapshot {
  const optionSourceId = (propertyKey: string, name: string) =>
    `option:${propertyKey}:${name}`;
  const propertyOptions = (
    property: PresetDatabaseDefinition['properties'][number],
  ): { name: string; color: string }[] =>
    property.options ??
    (property.type === PropertyType.STATUS ? [...DEFAULT_STATUS_OPTIONS] : []);

  const toValue = (
    property: PresetDatabaseDefinition['properties'][number],
    value: PresetDatabaseValue,
  ): RowValueData => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      return { start: addDays(today, value.daysFromToday) };
    }
    if (SINGLE_OPTION_TYPES.includes(property.type)) {
      return optionSourceId(property.key, String(value));
    }
    if (property.type === PropertyType.MULTI_SELECT && Array.isArray(value)) {
      return value.map((name) => optionSourceId(property.key, name));
    }
    return value;
  };

  return {
    sourceId: 'database',
    name: definition.name,
    properties: definition.properties.map((property, index) => ({
      sourceId: `property:${property.key}`,
      name: property.name,
      type: property.type,
      isDefault: property.type === PropertyType.TITLE,
      isHideable: property.type !== PropertyType.TITLE,
      position: String(index),
      options: propertyOptions(property).map((option, optionIndex) => ({
        sourceId: optionSourceId(property.key, option.name),
        name: option.name,
        color: option.color,
        position: String(optionIndex),
      })),
    })),
    rows: definition.rows.map((row, rowIndex) => ({
      sourceId: `row:${rowIndex}`,
      values: definition.properties.flatMap(
        (property): ProvisionDatabaseRowValueSnapshot[] =>
          row[property.key] === undefined
            ? []
            : [
                {
                  sourceId: `value:${rowIndex}:${property.key}`,
                  propertySourceId: `property:${property.key}`,
                  value: toValue(property, row[property.key]),
                },
              ],
      ),
    })),
    views: definition.views.map((view, viewIndex) => ({
      sourceId: `view:${viewIndex}`,
      name: view.name,
      type: view.type,
      position: String(viewIndex),
      properties: definition.properties.map((property, index) => ({
        sourceId: `view:${viewIndex}:${property.key}`,
        propertySourceId: `property:${property.key}`,
        position: String(index),
        visible: true,
        width: null,
      })),
    })),
  };
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

const priorityOption = (name: 'High' | 'Medium' | 'Low') => ({
  name,
  color: DEFAULT_PRIORITY_OPTIONS.find((option) => option.name === name)!.color,
});

const PRESET_DATABASES: Partial<Record<PagePreset, PresetDatabaseDefinition>> =
  {
    [PagePreset.TASKS]: {
      name: 'Tasks',
      properties: [
        { key: 'name', name: 'Name', type: PropertyType.TITLE },
        { key: 'status', name: 'Status', type: PropertyType.STATUS },
        { key: 'assignee', name: 'Assignee', type: PropertyType.PERSON },
        { key: 'due', name: 'Due date', type: PropertyType.DATE },
        {
          key: 'priority',
          name: 'Priority',
          type: PropertyType.SELECT,
          options: [
            priorityOption('High'),
            priorityOption('Medium'),
            priorityOption('Low'),
          ],
        },
      ],
      views: [
        { name: 'Table', type: DatabaseViewType.TABLE },
        { name: 'Board', type: DatabaseViewType.BOARD },
      ],
      rows: [
        {
          name: 'Write the project brief',
          status: 'Done',
          due: { daysFromToday: -1 },
          priority: 'High',
        },
        {
          name: 'Break the work into tasks',
          status: 'In progress',
          due: { daysFromToday: 2 },
          priority: 'Medium',
        },
        {
          name: 'Review the first draft',
          status: 'Not started',
          due: { daysFromToday: 5 },
          priority: 'Low',
        },
      ],
    },
    [PagePreset.PROJECT_OVERVIEW]: {
      name: 'Milestones',
      properties: [
        { key: 'name', name: 'Name', type: PropertyType.TITLE },
        { key: 'status', name: 'Status', type: PropertyType.STATUS },
        { key: 'owner', name: 'Owner', type: PropertyType.PERSON },
        { key: 'due', name: 'Due date', type: PropertyType.DATE },
      ],
      views: [
        { name: 'Table', type: DatabaseViewType.TABLE },
        { name: 'Calendar', type: DatabaseViewType.CALENDAR },
      ],
      rows: [
        { name: 'Kickoff', status: 'Done', due: { daysFromToday: 0 } },
        {
          name: 'First release',
          status: 'Not started',
          due: { daysFromToday: 14 },
        },
        { name: 'Launch', status: 'Not started', due: { daysFromToday: 30 } },
      ],
    },
    [PagePreset.MEETING_NOTES]: {
      name: 'Action items',
      properties: [
        { key: 'name', name: 'Name', type: PropertyType.TITLE },
        { key: 'owner', name: 'Owner', type: PropertyType.PERSON },
        { key: 'due', name: 'Due date', type: PropertyType.DATE },
        { key: 'done', name: 'Done', type: PropertyType.CHECKBOX },
      ],
      views: [{ name: 'Table', type: DatabaseViewType.TABLE }],
      rows: [
        {
          name: 'Share the meeting notes',
          due: { daysFromToday: 1 },
          done: false,
        },
        {
          name: 'Follow up on open questions',
          due: { daysFromToday: 3 },
          done: false,
        },
      ],
    },
    [PagePreset.JOURNAL]: {
      name: 'Entries',
      properties: [
        { key: 'name', name: 'Name', type: PropertyType.TITLE },
        { key: 'date', name: 'Date', type: PropertyType.DATE },
        {
          key: 'mood',
          name: 'Mood',
          type: PropertyType.SELECT,
          options: [
            { name: 'Great', color: '#22C55E' },
            { name: 'Good', color: '#3B82F6' },
            { name: 'Okay', color: '#EAB308' },
            { name: 'Bad', color: '#EF4444' },
          ],
        },
        {
          key: 'tags',
          name: 'Tags',
          type: PropertyType.MULTI_SELECT,
          options: [
            { name: 'Work', color: '#8B5CF6' },
            { name: 'Personal', color: '#EC4899' },
          ],
        },
      ],
      views: [
        { name: 'Table', type: DatabaseViewType.TABLE },
        { name: 'Calendar', type: DatabaseViewType.CALENDAR },
      ],
      rows: [
        {
          name: 'A productive day',
          date: { daysFromToday: 0 },
          mood: 'Great',
          tags: ['Work'],
        },
        {
          name: 'Slow morning, good walk',
          date: { daysFromToday: -1 },
          mood: 'Good',
          tags: ['Personal'],
        },
      ],
    },
    [PagePreset.ONBOARDING]: {
      name: 'Checklist',
      properties: [
        { key: 'name', name: 'Name', type: PropertyType.TITLE },
        { key: 'done', name: 'Done', type: PropertyType.CHECKBOX },
        { key: 'owner', name: 'Owner', type: PropertyType.PERSON },
        { key: 'due', name: 'Due date', type: PropertyType.DATE },
      ],
      views: [{ name: 'Table', type: DatabaseViewType.TABLE }],
      rows: [
        {
          name: 'Meet your teammates',
          done: false,
          due: { daysFromToday: 1 },
        },
        {
          name: 'Set up your accounts and tools',
          done: false,
          due: { daysFromToday: 2 },
        },
        {
          name: 'Read the team home page',
          done: false,
          due: { daysFromToday: 5 },
        },
      ],
    },
  };

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
        text: 'Welcome to your workspace. Use this page to learn the basics, then remove what you no longer need.',
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
      {
        type: PageBlockType.CALLOUT,
        text: 'Track every task in one place. Switch to Board to move tasks across statuses.',
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
    database: PRESET_DATABASES[key] ?? null,
  };
}
