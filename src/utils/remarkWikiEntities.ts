/**
 * remark 插件：解析 `[[实体名称]]` 语法
 *
 * 在 Markdown AST（MDAST）层把 `[[实体名称]]` 文本标记转换为标准的
 * link 节点，其 url 用 `wiki:` 前缀承载实体名称（如 `wiki:林深`）。
 * 这样 react-markdown 渲染时，components.a 能依据 href 前缀识别出百科
 * 实体链接，进而渲染为 WikiPopover，无需 rehype-raw 等 HTML 解析依赖。
 *
 * 设计权衡：
 * - 用 link 节点而非自定义节点类型，避免向 react-markdown 注册自定义渲染器；
 * - 用 `wiki:` 前缀而非 data 属性，因 components.a 能直接拿到 href；
 * - 实体名中的 `]` 不允许（正则 `[^\]]+` 已保证），避免歧义。
 */

import type { Plugin } from 'unified';
import type { Link, Text, Root, RootContent } from 'mdast';
import { visit } from 'unist-util-visit';

const WIKI_ENTITY_REGEX = /\[\[([^\]]+)\]\]/g;

/** 从 link 节点的 url（`wiki:名称`）还原实体名称 */
export function parseWikiHref(href: string): string | null {
  if (!href.startsWith('wiki:')) return null;
  return decodeURIComponent(href.slice('wiki:'.length));
}

/** 生成 wiki link 的 url */
export function buildWikiHref(name: string): string {
  return `wiki:${encodeURIComponent(name)}`;
}

interface EntityMatch {
  name: string;
  start: number;
  end: number;
}

function findEntities(text: string): EntityMatch[] {
  const matches: EntityMatch[] = [];
  let match: RegExpExecArray | null;
  WIKI_ENTITY_REGEX.lastIndex = 0;
  while ((match = WIKI_ENTITY_REGEX.exec(text)) !== null) {
    matches.push({
      name: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return matches;
}

/** 把含 `[[实体]]` 的 text 节点拆分为 text + wiki link 序列 */
function splitTextNode(textNode: Text): RootContent[] {
  const entities = findEntities(textNode.value);
  if (entities.length === 0) return [textNode];

  const parts: RootContent[] = [];
  let lastIndex = 0;

  for (const entity of entities) {
    // 实体前的纯文本
    if (entity.start > lastIndex) {
      parts.push({
        type: 'text',
        value: textNode.value.slice(lastIndex, entity.start),
      } as Text);
    }

    // wiki link 节点
    const link: Link = {
      type: 'link',
      url: buildWikiHref(entity.name),
      data: { hName: 'a' },
      children: [{ type: 'text', value: entity.name }],
    };
    parts.push(link);

    lastIndex = entity.end;
  }

  // 尾部纯文本
  if (lastIndex < textNode.value.length) {
    parts.push({
      type: 'text',
      value: textNode.value.slice(lastIndex),
    } as Text);
  }

  return parts;
}

export const remarkWikiEntities: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index == null) return;
      // 仅处理含 `[[` 的文本，避免无标记文本无谓拆分
      if (!node.value.includes('[[')) return;

      const replaced = splitTextNode(node);
      if (replaced.length === 1 && replaced[0] === node) return;

      parent.children.splice(index, 1, ...replaced);
      // 跳过新插入的节点，避免重复遍历
      return ['skip', index + replaced.length] as const;
    });
  };
};

export default remarkWikiEntities;
