import React, { useEffect, useState } from 'react';
import { Wallet, History, TrendingUp, ArrowUpRight, ArrowDownLeft, Coins, RefreshCw, BookMarked } from 'lucide-react';
import { revenueService, WalletInfo, Transaction } from '../../api/revenueService';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const WalletDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = async () => {
    try {
      const data = await revenueService.getWallet();
      setWallet(data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Wallet className="text-accent-600" size={32} />
            收益中心
          </h1>
          <p className="text-slate-500 mt-1">查看你的平行宇宙贡献收益与分润记录</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          刷新数据
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-accent-600 to-violet-700 p-8 lg:p-6 rounded-3xl text-white shadow-xl shadow-accent-200 relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Coins size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-indigo-100 font-medium mb-1 text-sm">当前余额</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{wallet?.balance.toFixed(2)}</span>
              <span className="text-xs font-bold opacity-80">{wallet?.currency}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 rounded-xl text-xs font-bold transition-all">
              提现
            </button>
            <button className="flex-1 bg-ink-50 text-accent-700 py-2 rounded-xl text-xs font-bold transition-all shadow-lg">
              充值
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-accent-50 text-accent-500 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-accent-500 bg-accent-50 px-2 py-1 rounded-lg">创作</span>
          </div>
          <div className="mt-4">
            <p className="text-slate-500 text-sm font-medium">累计创作收益</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {(wallet?.user.transactions.reduce((acc, t) => t.type === 'REVENUE_SHARE' ? acc + t.amount : acc, 0) || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-accent-50 text-accent-500 rounded-2xl">
              <BookMarked size={24} />
            </div>
            <span className="text-xs font-bold text-accent-500 bg-accent-50 px-2 py-1 rounded-lg">策展</span>
          </div>
          <div className="mt-4">
            <p className="text-slate-500 text-sm font-medium">累计书单分润</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {(wallet?.user.transactions.reduce((acc, t) => (t.type as any) === 'CURATION_REWARD' ? acc + t.amount : acc, 0) || 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <History size={24} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-slate-500 text-sm font-medium">近7日交易</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{wallet?.user.transactions.length || 0} 次</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900">收支明细</h2>
          <select className="bg-slate-50 text-sm font-bold text-slate-600 border-none rounded-lg focus:ring-0">
            <option>全部交易</option>
            <option>分润收益</option>
            <option>提现记录</option>
          </select>
        </div>
        <div className="divide-y divide-slate-100">
          {wallet?.user.transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-full mb-4">
                <History size={32} />
              </div>
              <p className="text-slate-500 font-medium">暂无交易记录</p>
            </div>
          ) : (
            wallet?.user.transactions.map((tx) => (
              <div key={tx.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    tx.amount > 0 ? 'bg-accent-50 text-accent-500' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tx.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.description || tx.type}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(tx.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${
                    tx.amount > 0 ? 'text-accent-500' : 'text-slate-900'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">UNIV COIN</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
