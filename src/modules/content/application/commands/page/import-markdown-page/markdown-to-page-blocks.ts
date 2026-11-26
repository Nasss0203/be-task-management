import { randomUUID } from 'crypto';
import { Lexer, type Token, type Tokens } from 'marked';

import type { CreatePageBlockSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';

export const MARKDOWN_IMPORT_LIMITS = {
  maxFileSize: 1024 * 1024,
  maxBlocks: 2000,
  maxDepth: 5,
  maxWarnings: 100,
  maxTitleLength: 255,
} as const;

export interface MarkdownImportWarning {
  line: number;
  message: string;
}

export interface MarkdownPageDraft {
  title: string | null;
  blocks: CreatePageBlockSnapshotInput[];
  warnings: MarkdownImportWarning[];
}

const ESCAPED_BLOCK_MARKER = /^\\(#{1,6}\s|[-+*]\s|>|\d+[.)]\s|-{3,}\s*$|```)/;
const REMOTE_URL = /^https?:\/\//i;
const LINE_BREAK_TAG = /<br\s*\/?>/gi;

const cleanText = (text: string) =>
  text
    .split('\n')
    .map((line) =>
      line.replace(/ {2,}$/, '').replace(ESCAPED_BLOCK_MARKER, '$1'),
    )
    .join('\n')
    .trim();

const headingLevel = (depth: number) => (depth <= 2 ? 1 : depth === 3 ? 2 : 3);

const lineOf = (markdown: string, offset: number) =>
  markdown.slice(0, offset).split('\n').length;

const fileName = (href: string) => {
  const name = href.split(/[\\/]/).pop() ?? href;
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
};

class DraftBuilder {
  readonly blocks: CreatePageBlockSnapshotInput[] = [];
  readonly warnings: MarkdownImportWarning[] = [];
  private readonly childCount = new Map<string | null, number>();
  line = 1;

  add(
    parentSourceId: string | null,
    type: PageBlockType,
    content?: PageBlockJson,
    styleConfig?: PageBlockStyleConfig,
  ): string {
    const orderIndex = this.childCount.get(parentSourceId) ?? 0;
    this.childCount.set(parentSourceId, orderIndex + 1);
    const sourceId = `md-${this.blocks.length}`;
    this.blocks.push({
      sourceId,
      parentSourceId,
      type,
      positionX: null,
      positionY: null,
      width: null,
      height: null,
      orderIndex,
      ...(content ? { content } : {}),
      ...(styleConfig ? { styleConfig } : {}),
    });
    return sourceId;
  }

  warn(message: string) {
    if (this.warnings.length < MARKDOWN_IMPORT_LIMITS.maxWarnings) {
      this.warnings.push({ line: this.line, message });
    }
  }
}

function addParagraph(
  draft: DraftBuilder,
  parent: string | null,
  token: Tokens.Paragraph | Tokens.Text,
) {
  const inline = (token.tokens ?? []).filter(
    (child) =>
      child.type !== 'space' && !(child.type === 'text' && !child.raw.trim()),
  );
  const image =
    inline.length === 1 && inline[0].type === 'image'
      ? (inline[0] as Tokens.Image)
      : null;

  if (image && REMOTE_URL.test(image.href)) {
    draft.add(parent, PageBlockType.IMAGE, {
      url: image.href,
      caption: image.text,
    });
    return;
  }
  if (image) {
    const name = fileName(image.href);
    draft.add(parent, PageBlockType.TEXT, { text: `[Ảnh: ${name}]` });
    draft.warn(`Ảnh cục bộ "${name}" chưa được tải lên`);
    return;
  }

  const text = cleanText(token.text);
  if (text) draft.add(parent, PageBlockType.TEXT, { text });
}

function addList(
  draft: DraftBuilder,
  parent: string | null,
  list: Tokens.List,
  depth: number,
) {
  const type = (item: Tokens.ListItem) =>
    item.task
      ? PageBlockType.TODO
      : list.ordered
        ? PageBlockType.NUMBERED_LIST
        : PageBlockType.BULLETED_LIST;

  for (const item of list.items) {
    const [first, ...rest] = item.tokens;
    const hasText = first?.type === 'text' || first?.type === 'paragraph';
    const text = hasText ? cleanText((first as Tokens.Text).text) : '';
    const itemId = draft.add(
      parent,
      type(item),
      item.task ? { text, checked: item.checked === true } : { text },
    );

    const children = hasText ? rest : item.tokens;
    if (children.length === 0) continue;
    if (depth >= MARKDOWN_IMPORT_LIMITS.maxDepth) {
      draft.warn(
        `Danh sách lồng quá ${MARKDOWN_IMPORT_LIMITS.maxDepth} cấp, phần sâu hơn được đưa lên cùng cấp`,
      );
      addTokens(draft, parent, children, depth);
    } else {
      addTokens(draft, itemId, children, depth + 1);
    }
  }
}

function addTable(
  draft: DraftBuilder,
  parent: string | null,
  table: Tokens.Table,
) {
  const row = (cells: Tokens.TableCell[]) => ({
    id: randomUUID(),
    cells: cells.map((cell) => ({
      id: randomUUID(),
      text: cell.text.replace(LINE_BREAK_TAG, '\n'),
    })),
  });

  draft.add(parent, PageBlockType.TABLE_SIMPLE, {
    rows: [row(table.header), ...table.rows.map(row)],
    hasHeaderRow: true,
  });
}

function addTokens(
  draft: DraftBuilder,
  parent: string | null,
  tokens: Token[],
  depth: number,
) {
  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const heading = token as Tokens.Heading;
        draft.add(
          parent,
          PageBlockType.HEADER,
          { text: cleanText(heading.text) },
          { level: headingLevel(heading.depth) },
        );
        break;
      }
      case 'paragraph':
      case 'text':
        addParagraph(draft, parent, token as Tokens.Paragraph);
        break;
      case 'list':
        addList(draft, parent, token as Tokens.List, depth);
        break;
      case 'blockquote': {
        const text = cleanText((token as Tokens.Blockquote).text);
        if (text) draft.add(parent, PageBlockType.QUOTE, { text });
        break;
      }
      case 'code': {
        const code = token as Tokens.Code;
        const language = code.lang?.trim() || 'plaintext';
        if (language.toLowerCase() === 'mermaid') {
          draft.add(parent, PageBlockType.MERMAID, { text: code.text });
        } else {
          draft.add(parent, PageBlockType.CODE, { text: code.text, language });
        }
        break;
      }
      case 'hr':
        draft.add(parent, PageBlockType.DIVIDER);
        break;
      case 'table':
        addTable(draft, parent, token as Tokens.Table);
        break;
      case 'html': {
        const text = (token as Tokens.HTML).text.trim();
        if (text) draft.add(parent, PageBlockType.TEXT, { text });
        break;
      }
      default:
        break;
    }
  }
}

export function markdownToPageBlocks(markdown: string): MarkdownPageDraft {
  const source = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const tokens = new Lexer({ gfm: true }).lex(source);
  const draft = new DraftBuilder();

  const firstContent = tokens.findIndex((token) => token.type !== 'space');
  const first = tokens[firstContent];
  const title =
    first?.type === 'heading' && first.depth === 1
      ? cleanText((first as Tokens.Heading).text).replace(/\n/g, ' ')
      : null;

  let offset = 0;
  tokens.forEach((token, index) => {
    draft.line = lineOf(source, offset);
    offset += token.raw.length;
    if (title !== null && index === firstContent) return;
    addTokens(draft, null, [token], 1);
  });

  return { title, blocks: draft.blocks, warnings: draft.warnings };
}
