import type { CreatePageBlockSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { markdownToPageBlocks } from './markdown-to-page-blocks';

const outline = (blocks: CreatePageBlockSnapshotInput[]) => {
  const depth = new Map<string, number>();
  return blocks.map((block) => {
    const level = block.parentSourceId
      ? depth.get(block.parentSourceId)! + 1
      : 0;
    depth.set(block.sourceId, level);
    const text = (block.content as { text?: string } | undefined)?.text;
    return `${'  '.repeat(level)}${block.type}${text !== undefined ? ` ${text}` : ''}`;
  });
};

const exported = [
  '# Kế hoạch',
  '',
  '## Mục tiêu',
  '',
  'Đoạn **đậm** và [link](https://a.dev)  ',
  'dòng hai',
  '',
  '- Việc A',
  '',
  '  - Việc A.1',
  '',
  '    - Việc A.1.a',
  '- Việc B',
  '',
  '1. Bước 1',
  '2. Bước 2',
  '',
  '- [ ] Chưa xong',
  '- [x] Đã xong',
  '',
  '> 💡 Ghi chú',
  '',
  '---',
  '',
  '```ts',
  'const a = 1;',
  '```',
  '',
  '```mermaid',
  'graph TD',
  '```',
  '',
  '| Cột 1 | Cột 2 |',
  '| --- | --- |',
  '| a \\| b | dòng<br>hai |',
  '',
  '![Logo](https://cdn.test/logo.png)',
  '',
  '\\# không phải heading',
  '',
].join('\n');

describe('markdownToPageBlocks', () => {
  it('reads a file made by Export Markdown back into the same blocks', () => {
    const draft = markdownToPageBlocks(exported);

    expect(draft.title).toBe('Kế hoạch');
    expect(outline(draft.blocks)).toEqual([
      'HEADER Mục tiêu',
      'TEXT Đoạn **đậm** và [link](https://a.dev)\ndòng hai',
      'BULLETED_LIST Việc A',
      '  BULLETED_LIST Việc A.1',
      '    BULLETED_LIST Việc A.1.a',
      'BULLETED_LIST Việc B',
      'NUMBERED_LIST Bước 1',
      'NUMBERED_LIST Bước 2',
      'TODO Chưa xong',
      'TODO Đã xong',
      'QUOTE 💡 Ghi chú',
      'DIVIDER',
      'CODE const a = 1;',
      'MERMAID graph TD',
      'TABLE_SIMPLE',
      'IMAGE',
      'TEXT # không phải heading',
    ]);
    expect(draft.blocks[0].styleConfig).toEqual({ level: 1 });
    expect(draft.blocks[8].content).toEqual({
      text: 'Chưa xong',
      checked: false,
    });
    expect(draft.blocks[9].content).toEqual({ text: 'Đã xong', checked: true });
    expect(draft.blocks[12].content).toEqual({
      text: 'const a = 1;',
      language: 'ts',
    });
    const table = draft.blocks[14].content as {
      rows: { cells: { text: string }[] }[];
      hasHeaderRow: boolean;
    };
    expect(table.hasHeaderRow).toBe(true);
    expect(table.rows.map((row) => row.cells.map((cell) => cell.text))).toEqual(
      [
        ['Cột 1', 'Cột 2'],
        ['a | b', 'dòng\nhai'],
      ],
    );
    expect(draft.blocks[15].content).toEqual({
      url: 'https://cdn.test/logo.png',
      caption: 'Logo',
    });
    expect(draft.warnings).toEqual([]);
  });

  it('numbers siblings from zero under each parent', () => {
    const draft = markdownToPageBlocks('- A\n  - A1\n  - A2\n- B\n');

    expect(draft.blocks.map((block) => block.orderIndex)).toEqual([0, 0, 1, 1]);
    expect(draft.blocks[1].parentSourceId).toBe(draft.blocks[0].sourceId);
  });

  it('maps heading depths and keeps a later top heading as a block', () => {
    const draft = markdownToPageBlocks(
      'Mở đầu\n\n# H1\n\n### H3\n\n##### H5\n',
    );

    expect(draft.title).toBeNull();
    expect(
      draft.blocks.map((block) => [block.type, block.styleConfig?.level]),
    ).toEqual([
      [PageBlockType.TEXT, undefined],
      [PageBlockType.HEADER, 1],
      [PageBlockType.HEADER, 2],
      [PageBlockType.HEADER, 3],
    ]);
  });

  it('keeps local images as text and reports them with their line', () => {
    const draft = markdownToPageBlocks('# T\n\nchữ\n\n![](images/a%20b.png)\n');

    expect(outline(draft.blocks)).toEqual(['TEXT chữ', 'TEXT [Ảnh: a b.png]']);
    expect(draft.warnings).toEqual([
      { line: 5, message: 'Ảnh cục bộ "a b.png" chưa được tải lên' },
    ]);
  });

  it('lifts lists nested deeper than five levels and warns', () => {
    const markdown = Array.from(
      { length: 7 },
      (_, level) => `${'  '.repeat(level)}- L${level + 1}`,
    ).join('\n');

    const draft = markdownToPageBlocks(markdown);

    expect(outline(draft.blocks)).toEqual([
      'BULLETED_LIST L1',
      '  BULLETED_LIST L2',
      '    BULLETED_LIST L3',
      '      BULLETED_LIST L4',
      '        BULLETED_LIST L5',
      '        BULLETED_LIST L6',
      '        BULLETED_LIST L7',
    ]);
    expect(draft.warnings).toHaveLength(2);
  });

  it('strips the BOM, keeps raw html as text and defaults the code language', () => {
    const draft = markdownToPageBlocks(
      '\uFEFF# Tiêu đề\r\n\r\n<div>xin chào</div>\r\n\r\n```\r\nplain\r\n```\r\n',
    );

    expect(draft.title).toBe('Tiêu đề');
    expect(draft.blocks.map((block) => block.content)).toEqual([
      { text: '<div>xin chào</div>' },
      { text: 'plain', language: 'plaintext' },
    ]);
  });
});
