export interface DateRowValue {
  start: string;
  end?: string | null;
  timeZone?: string | null;
}

export type RowValueData =
  | string
  | number
  | boolean
  | string[]
  | DateRowValue
  | null;
