import React, { useMemo, useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { defaultUrlTransform } from 'react-markdown';
import { wikiService } from '../../api/wikiService';
import { remarkWikiEntities, parseWikiHref } from '../../utils/remarkWikiEntities';
import WikiPopover from './WikiPopover';

interface WikiTextProps {
  /** Markdown 原文，可含 `[[实体名称]]` 标记 */
  content: string;
  className?: string;
}

/**
 * useWikiNameCache — 批量预查文本中的实体名称，缓存 name→wikiId 映射。
 *
 * 避免每个 WikiPopover 各自 lookup：页面加载时一次性把所有 `[[实体]]`
 * 收集去重，批量请求，结果存入 Map。未命中的实体 wikiId 为 null，
 * WikiPopover 会回退到按名称 lookup。
 */
function useWikiNameCache(content: string) {
  const [nameMap, setNameMap] = useState<Map<string, string | null>>(new Map());
  const inflightRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 收集所有 [[实体]] 名称（去重）
    const names = new Set<string>();
    const regex = /\[\[([^\]]+)\]\]/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      names.add(match[1].trim());
    }
    if (names.size === 0) return;

    // 取消上一次未完成的请求
    inflightRef.current?.abort();
    const controller = new AbortController();
    inflightRef.current = controller;

    const namesArr = Array.from(names);
    Promise.all(
      namesArr.map(async (name) => {
        try {
          const res = await wikiService.lookup(name, 1);
          return [name, res[0]?.id ?? null] as const;
        } catch {
          return [name, null] as const;
        }
      }),
    ).then((entries) => {
      if (controller.signal.aborted) return;
      setNameMap(new Map(entries));
    });

    return () => controller.abort();
  }, [content]);

  return nameMap;
}

/**
 * WikiText — 支持百科实体标记的 Markdown 渲染器
 *
 * 在正文 Markdown 中，`[[实体名称]]` 会被 remarkWikiEntities 插件转成
 * 带 `wiki:` 前缀的链接，渲染时替换为 WikiPopover 浮窗。
 */
const WikiText: React.FC<WikiTextProps> = ({ content, className }) => {
  const nameMap = useWikiNameCache(content || '');

  const components = useMemo<Components>(
    () => ({
      // 拦截 link 节点：href 以 `wiki:` 开头时渲染为百科浮窗
      a({ href, children, ...props }) {
        const entityName = href ? parseWikiHref(href) : null;
        if (entityName) {
          const wikiId = nameMap.get(entityName) ?? null;
          return (
            <WikiPopover entityName={entityName} wikiId={wikiId}>
              {children}
            </WikiPopover>
          );
        }
        // 普通链接保持默认行为
        return <a href={href} {...props}>{children}</a>;
      },
    }),
    [nameMap],
  );

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkWikiEntities]}
        components={components}
        urlTransform={(url) => (url.startsWith('wiki:') ? url : defaultUrlTransform(url))}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default WikiText;
