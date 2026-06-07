/**
 * Wiki 实体标记解析器
 *
 * 解析 `[[实体名称]]` 语法（类似 Obsidian 的 wiki 链接语法），
 * 将文本中的百科实体标记转换为可交互元素。
 */

export interface WikiEntityMatch {
  /** 实体名称（双括号内的内容） */
  name: string;
  /** 在原文中的开始位置 */
  start: number;
  /** 在原文中的结束位置 */
  end: number;
}

/**
 * 解析文本中所有的 `[[实体名称]]` 标记
 */
export function parseWikiEntities(text: string): WikiEntityMatch[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches: WikiEntityMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      name: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
}

/**
 * 将文本中的 `[[实体名称]]` 标记渲染为 React 节点数组
 * 未匹配到百科条目时，实体名称以特殊样式显示（灰色虚线，表示还未创建百科）
 *
 * @param text        原始文本
 * @param onEntityClick  点击实体时的回调
 * @param lookupEntity   根据名称查找百科条目的函数，返回 id（null 表示未找到）
 */
export function renderWikiEntities(
  text: string,
  onEntityClick: (name: string, wikiId: string | null) => void,
  lookupEntity: (name: string) => string | null
): Array<{ type: 'text' | 'entity'; content: string; wikiId?: string | null }> {
  const entities = parseWikiEntities(text);
  if (entities.length === 0) {
    return [{ type: 'text', content: text }];
  }

  const parts: Array<{ type: 'text' | 'entity'; content: string; wikiId?: string | null }> = [];
  let lastIndex = 0;

  for (const entity of entities) {
    // 实体前的纯文本
    if (entity.start > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, entity.start),
      });
    }

    const wikiId = lookupEntity(entity.name);

    parts.push({
      type: 'entity',
      content: entity.name,
      wikiId,
    });

    lastIndex = entity.end;
  }

  // 尾部纯文本
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
}
