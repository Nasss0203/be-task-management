export type PageBlockDatabaseViewDataConfig = {
  database_id: string;
  view_id: string;
};

export type PageBlockJson =
  | Record<string, unknown>
  | unknown[]
  | PageBlockDatabaseViewDataConfig
  | null;
export type PageBlockStyleConfig = Record<string, unknown> | null;
