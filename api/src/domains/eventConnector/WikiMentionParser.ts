/**
 * Wiki Mention Parser
 *
 * 从富文本（事件描述、章节正文等）中扫描 [[wiki:slug]] 引用，
 * 解析后落入 WikiEntityMention 表，供事件卡 📍 地点连接器查询。
 *
 * 语法约定：
 *   [[wiki:character/lin-yuan]]      — 显式带 contentType 前缀（推荐）
 *   [[wiki:lin-yuan]]                — 仅 slug（按 unique slug 解析）
 *
 * 选择 [[wiki:slug]] 而非 @slug 的原因：
 *   - 事件描述里 @xxx 易与角色名/用户名混淆
 *   - [[ ]] 是 Obsidian/MediaWiki 通用语法，作者熟悉
 *   - 与 schema.prisma 中已有的 WikiLink 模型设计风格一致
 *
 * 纯函数模块：所有 IO 在 syncEventWikiMentions 中完成，便于单元测试解析器。
 */

import { prisma } from '../../prisma';

const WIKI_PATTERN = /\[\[wiki:([a-zA-Z0-9/_-]+)\]\]/g;

/**
 * 提取文本中所有 [[wiki:slug]] 引用。
 * 返回去重后的 slug 列表（保持首次出现顺序）。
 *
 * @example
 *   parseWikiSlugs("主角在[[wiki:port-city]]遇见[[wiki:character/lin-yuan]]")
 *   // → ["port-city", "character/lin-yuan"]
 */
export function parseWikiSlugs(text: string | null | undefined): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of text.matchAll(WIKI_PATTERN)) {
    const slug = match[1];
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}

/**
 * 把 slug 列表归一化为 {prefix?, slug} 形式，供 wiki_pages 查询。
 * 输入 'character/lin-yuan' → { prefix: 'character', slug: 'lin-yuan' }
 * 输入 'lin-yuan'           → { slug: 'lin-yuan' }
 */
export function splitSlug(input: string): { prefix?: string; slug: string } {
  const slashIdx = input.indexOf('/');
  if (slashIdx === -1) return { slug: input };
  return { prefix: input.slice(0, slashIdx), slug: input.slice(slashIdx + 1) };
}

/**
 * 同步某事件的 wiki 提及关系。
 *
 * 行为：
 * 1. 解析 event.description 中的 [[wiki:slug]] 引用
 * 2. 按 slug 查 wiki_pages 拿到 wikiPageId
 * 3. 删除该事件原有的 mentions（targetType='event', eventId=...）
 * 4. 插入新 mentions（去重，跳过未匹配的 slug）
 *
 * 调用时机：StoryEventService.create / update 之后（建议 fire-and-forget）。
 *
 * @param eventId    事件 ID
 * @param description 事件描述文本（可能含 [[wiki:...]] 引用）
 * @returns 实际匹配并落表的引用数（0 表示无匹配）
 */
export async function syncEventWikiMentions(
  eventId: string,
  description: string | null | undefined,
): Promise<number> {
  const slugs = parseWikiSlugs(description);

  // 删除该事件原 mentions（无论 slugs 是否为空都要清理，覆盖更新语义）
  await prisma.wikiEntityMention.deleteMany({
    where: { targetType: 'event', targetId: eventId },
  });

  if (slugs.length === 0) return 0;

  // 按 slug 反查 WikiPage（slug 在 schema 中是 (storyId, slug) 唯一，
  // 这里允许跨故事匹配；同名取任意一个即可）
  const pages = await prisma.wikiPage.findMany({
    where: { slug: { in: slugs.map((s) => splitSlug(s).slug) } },
    select: { id: true, slug: true, contentType: true },
  });

  // slug → wikiPageId 映射（同名取首个）
  const slugToPage = new Map<string, { id: string; contentType: string }>();
  for (const p of pages) {
    if (!slugToPage.has(p.slug)) slugToPage.set(p.slug, p);
  }

  // 构建插入数据，去重（同一 wikiPageId × 同一 event 只插一次）
  const seenPageIds = new Set<string>();
  const toCreate: Array<{
    wikiPageId: string;
    targetType: string;
    targetId: string;
    eventId: string;
    mentionType: string;
  }> = [];

  for (const raw of slugs) {
    const { prefix, slug } = splitSlug(raw);
    const page = slugToPage.get(slug);
    if (!page) continue;
    // 若 slug 带前缀，校验 contentType 一致（character/x 要匹配 contentType='character'）
    if (prefix && page.contentType !== prefix) continue;
    if (seenPageIds.has(page.id)) continue;
    seenPageIds.add(page.id);
    toCreate.push({
      wikiPageId: page.id,
      targetType: 'event',
      targetId: eventId,
      eventId,
      mentionType: 'reference',
    });
  }

  if (toCreate.length === 0) return 0;

  await prisma.wikiEntityMention.createMany({ data: toCreate });
  return toCreate.length;
}
