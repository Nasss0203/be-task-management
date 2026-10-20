import type { CreatePageBlockSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { getPagePreset } from 'src/modules/content/application/services/page-presets';
import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';
import { WorkspaceStarter } from 'src/modules/workspace/domain/enums/workspace-starter.enum';

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

function toPages(presets: PagePreset[]): WorkspaceStarterPage[] {
  return presets.map((preset) => {
    const { title, icon, blocks } = getPagePreset(preset);
    return { title, icon, blocks };
  });
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
    pages: toPages([
      PagePreset.GETTING_STARTED,
      PagePreset.TODO_LIST,
      PagePreset.JOURNAL,
    ]),
  },
  {
    key: WorkspaceStarter.TEAM_WIKI,
    title: 'Team wiki',
    description: 'Team home, onboarding checklist and meeting notes.',
    icon: '📚',
    defaultName: 'Team wiki',
    pages: toPages([
      PagePreset.TEAM_HOME,
      PagePreset.ONBOARDING,
      PagePreset.MEETING_NOTES,
    ]),
  },
  {
    key: WorkspaceStarter.PROJECT_PLANNER,
    title: 'Project planner',
    description: 'Project overview with milestones and a task list.',
    icon: '🎯',
    defaultName: 'Project planner',
    pages: toPages([PagePreset.PROJECT_OVERVIEW, PagePreset.TASKS]),
  },
];

export function getWorkspaceStarter(
  starter: WorkspaceStarter,
): WorkspaceStarterDefinition {
  const definition = WORKSPACE_STARTERS.find((item) => item.key === starter);
  if (!definition) throw new Error(`Unknown workspace starter: ${starter}`);
  return definition;
}
