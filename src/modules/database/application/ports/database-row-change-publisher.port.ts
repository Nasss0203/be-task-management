export const DATABASE_ROWS_CHANGED_EVENT = 'database.rows.changed';

export type DatabaseRowsChangedEvent = {
  databaseId: string;
};

export interface DatabaseRowChangePublisher {
  publish(databaseId: string): void;
}
