import { describe, it, expect } from 'vitest';
import { parseWikiSlugs, splitSlug } from '../WikiMentionParser';

/**
 * WikiMentionParser 的纯函数部分（parseWikiSlugs / splitSlug）测试。
 * syncEventWikiMentions 涉及 Prisma IO，不在单元测试覆盖范围（需测试 DB）。
 */

describe('parseWikiSlugs', () => {
  it('空字符串 / null / undefined 返回空数组', () => {
    expect(parseWikiSlugs('')).toEqual([]);
    expect(parseWikiSlugs(null)).toEqual([]);
    expect(parseWikiSlugs(undefined)).toEqual([]);
  });

  it('无引用的纯文本返回空数组', () => {
    expect(parseWikiSlugs('主角在暴雨中遇见神秘人，命运的齿轮开始转动')).toEqual([]);
  });

  it('提取单个 [[wiki:slug]] 引用', () => {
    expect(parseWikiSlugs('主角前往 [[wiki:port-city]]')).toEqual(['port-city']);
  });

  it('提取多个引用，保持首次出现顺序', () => {
    const text = '在 [[wiki:port-city]] 遇见 [[wiki:character/lin-yuan]]，回忆起 [[wiki:port-city]]';
    expect(parseWikiSlugs(text)).toEqual(['port-city', 'character/lin-yuan']);
  });

  it('同一 slug 多次出现只算一次（去重）', () => {
    const text = '[[wiki:x]] [[wiki:x]] [[wiki:x]]';
    expect(parseWikiSlugs(text)).toEqual(['x']);
  });

  it('支持 contentType/slug 形式（带斜杠前缀）', () => {
    expect(parseWikiSlugs('[[wiki:character/lin-yuan]]')).toEqual(['character/lin-yuan']);
    expect(parseWikiSlugs('[[wiki:location/port-city]]')).toEqual(['location/port-city']);
  });

  it('slug 允许字母/数字/下划线/连字符/斜杠', () => {
    expect(parseWikiSlugs('[[wiki:lin-yuan_2024]]')).toEqual(['lin-yuan_2024']);
    expect(parseWikiSlugs('[[wiki:a/b-c_d]]')).toEqual(['a/b-c_d']);
  });

  it('不匹配其他 wiki 链接语法（[[plain]] 不含 wiki: 前缀）', () => {
    expect(parseWikiSlugs('[[some-page]] 和 [[note:xxx]]')).toEqual([]);
  });

  it('不匹配大写 WIKI 前缀（严格小写）', () => {
    expect(parseWikiSlugs('[[WIKI:port-city]]')).toEqual([]);
  });

  it('混合文本中正确提取', () => {
    const text = `第一章 主角的觉醒
    
主角在 [[wiki:port-city]] 的码头遇见 [[wiki:character/mysterious-man]]。
【作者注】这里参考了 [[wiki:concept/fate]] 的设定。

但 [[wiki:普通]] 不会被当作引用（中文字符）。`;
    expect(parseSlugList(text)).toEqual(['port-city', 'character/mysterious-man', 'concept/fate']);
  });
});

// 辅助：上面用例期望中文 slug 不被匹配，单独再验证一次
function parseSlugList(text: string): string[] {
  return parseWikiSlugs(text);
}

describe('splitSlug', () => {
  it('无斜杠的 slug 返回 { slug }', () => {
    expect(splitSlug('port-city')).toEqual({ slug: 'port-city' });
  });

  it('带 contentType 前缀的 slug 返回 { prefix, slug }', () => {
    expect(splitSlug('character/lin-yuan')).toEqual({ prefix: 'character', slug: 'lin-yuan' });
  });

  it('多段斜杠只按第一段切分', () => {
    // 例如 'a/b/c' → prefix='a', slug='b/c'
    expect(splitSlug('a/b/c')).toEqual({ prefix: 'a', slug: 'b/c' });
  });

  it('空字符串返回 { slug: "" }', () => {
    expect(splitSlug('')).toEqual({ slug: '' });
  });
});
