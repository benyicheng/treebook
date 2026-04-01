import client from './client';

export interface Transaction {
  id: string;
  amount: number;
  type: 'REVENUE_SHARE' | 'WITHDRAWAL' | 'RECHARGE';
  targetType?: 'STORY' | 'BRANCH';
  targetId?: string;
  description?: string;
  createdAt: string;
}

export interface WalletInfo {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: string;
  user: {
    transactions: Transaction[];
  };
}

export const revenueService = {
  getWallet: async (): Promise<WalletInfo> => {
    const { data } = await client.get('/revenue/wallet');
    return data;
  },

  settleStory: async (storyId: string) => {
    const { data } = await client.post(`/revenue/settle/${storyId}`);
    return data;
  }
};
