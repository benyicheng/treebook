import type { ModerationDecision, ModerationRequest } from '../types';

const DEFAULT_BLOCK_WORDS = [
  '出售账号',
  '加微信',
  '赌博',
  '博彩',
  '裸聊',
  '约炮',
  '枪支',
  '毒品',
  '恐怖袭击',
];

const containsAny = (text: string, words: string[]) => {
  const lowered = text.toLowerCase();
  return words.find((w) => lowered.includes(w.toLowerCase())) || null;
};

export class TextRuleProvider {
  readonly name = 'text_rules_v1';

  async moderate(req: ModerationRequest): Promise<ModerationDecision> {
    const text = req.text || '';
    if (!text.trim()) return { status: 'approved', labels: [], reasons: [] };

    const hit = containsAny(text, DEFAULT_BLOCK_WORDS);
    if (hit) {
      return {
        status: 'rejected',
        labels: ['illegal'],
        reasons: [`hit:${hit}`],
        score: 1,
        provider: this.name,
      };
    }

    return { status: 'approved', labels: [], reasons: [], score: 0, provider: this.name };
  }
}

