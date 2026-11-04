export enum PageBlockType {
  TEXT = 'TEXT',
  HEADER = 'HEADER',
  QUOTE = 'QUOTE',
  DIVIDER = 'DIVIDER',
  CODE = 'CODE',
  TODO = 'TODO',
  BULLETED_LIST = 'BULLETED_LIST',
  NUMBERED_LIST = 'NUMBERED_LIST',
  CALLOUT = 'CALLOUT',
  TABLE_OF_CONTENTS = 'TABLE_OF_CONTENTS',

  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  BOOKMARK = 'BOOKMARK',

  EMBED = 'EMBED',
  FIGMA = 'FIGMA',
  GITHUB_GIST = 'GITHUB_GIST',
  GOOGLE_MAPS = 'GOOGLE_MAPS',
  TWEET = 'TWEET',

  DATABASE_VIEW = 'DATABASE_VIEW',
  TABLE_SIMPLE = 'TABLE_SIMPLE',
  MERMAID = 'MERMAID',
  BUTTON = 'BUTTON',
  TOGGLE = 'TOGGLE',

  /** A row of 2–5 columns; its only children are COLUMN blocks. */
  COLUMN_LIST = 'COLUMN_LIST',
  /** One column of a COLUMN_LIST; `style_config.width_ratio` sets its share of the row. */
  COLUMN = 'COLUMN',

  SECTION = 'SECTION',

  FORM_FIELD = 'FORM_FIELD',
}
