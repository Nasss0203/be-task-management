import { PagePreset } from 'src/modules/content/domain/enums/page-preset.enum';
import { DatabaseViewType } from 'src/modules/database/domain/enums/database-view-type.enum';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import {
  buildPresetDatabaseSnapshot,
  getPagePreset,
  PAGE_PRESET_OPTIONS,
} from './page-presets';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

describe('page presets with a database', () => {
  it('gives the approved presets a database and leaves the others without one', () => {
    const names = Object.fromEntries(
      PAGE_PRESET_OPTIONS.map((key) => [
        key,
        getPagePreset(key).database?.name ?? null,
      ]),
    );

    expect(names).toEqual({
      [PagePreset.EMPTY]: null,
      [PagePreset.TODO_LIST]: null,
      [PagePreset.MEETING_NOTES]: 'Action items',
      [PagePreset.JOURNAL]: 'Entries',
      [PagePreset.PROJECT_OVERVIEW]: 'Milestones',
      [PagePreset.TASKS]: 'Tasks',
      [PagePreset.ONBOARDING]: 'Checklist',
    });
  });

  it('builds the Tasks database with default status options, priority options and views', () => {
    const snapshot = buildPresetDatabaseSnapshot(
      getPagePreset(PagePreset.TASKS).database!,
      '2026-11-26',
    );

    expect(snapshot.properties.map((p) => `${p.name}:${p.type}`)).toEqual([
      'Name:TITLE',
      'Status:STATUS',
      'Assignee:PERSON',
      'Due date:DATE',
      'Priority:SELECT',
    ]);
    const status = snapshot.properties.find((p) => p.name === 'Status')!;
    expect(status.options.map((o) => o.name)).toEqual([
      'Not started',
      'In progress',
      'Done',
    ]);
    const priority = snapshot.properties.find((p) => p.name === 'Priority')!;
    expect(priority.options.map((o) => o.name)).toEqual([
      'High',
      'Medium',
      'Low',
    ]);
    expect(snapshot.views.map((v) => v.type)).toEqual([
      DatabaseViewType.TABLE,
      DatabaseViewType.BOARD,
    ]);
    expect(snapshot.views[1].properties).toHaveLength(
      snapshot.properties.length,
    );
    expect(snapshot.rows).toHaveLength(3);
  });

  it('points option values at option source ids and turns day offsets into dates', () => {
    const snapshot = buildPresetDatabaseSnapshot(
      getPagePreset(PagePreset.TASKS).database!,
      '2026-12-31',
    );
    const status = snapshot.properties.find((p) => p.name === 'Status')!;
    const due = snapshot.properties.find((p) => p.name === 'Due date')!;
    const valueOf = (rowIndex: number, propertySourceId: string) =>
      snapshot.rows[rowIndex].values.find(
        (v) => v.propertySourceId === propertySourceId,
      )?.value;

    expect(valueOf(0, status.sourceId)).toBe(
      status.options.find((o) => o.name === 'Done')!.sourceId,
    );
    expect(valueOf(0, due.sourceId)).toEqual({ start: '2026-12-30' });
    expect(valueOf(1, due.sourceId)).toEqual({ start: '2027-01-02' });
  });

  it('keeps every sample value valid for its property type', () => {
    for (const key of PAGE_PRESET_OPTIONS) {
      const database = getPagePreset(key).database;
      if (!database) continue;
      const snapshot = buildPresetDatabaseSnapshot(database, '2026-11-26');
      const properties = new Map(
        snapshot.properties.map((p) => [p.sourceId, p]),
      );

      for (const row of snapshot.rows) {
        for (const { propertySourceId, value } of row.values) {
          const property = properties.get(propertySourceId)!;
          const optionIds = property.options.map((o) => o.sourceId);
          switch (property.type) {
            case PropertyType.TITLE:
              expect(typeof value).toBe('string');
              break;
            case PropertyType.CHECKBOX:
              expect(typeof value).toBe('boolean');
              break;
            case PropertyType.DATE:
              expect((value as { start: string }).start).toMatch(DATE_KEY);
              break;
            case PropertyType.SELECT:
            case PropertyType.STATUS:
              expect(optionIds).toContain(value);
              break;
            case PropertyType.MULTI_SELECT:
              for (const id of value as string[])
                expect(optionIds).toContain(id);
              break;
            default:
              throw new Error(`Unexpected sample value for ${property.type}`);
          }
        }
      }
    }
  });
});
