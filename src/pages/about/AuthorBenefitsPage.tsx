import React from 'react';

const AuthorBenefitsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-ink-700 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white mb-8">
          作者福利
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-accent-400 to-accent-500 rounded-xl p-6 text-white">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-xl font-bold mb-2">数据统计</h3>
            <p className="text-accent-100 text-sm">
              实时查看阅读量、收藏数、分支数等核心数据，了解作品表现
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-accent-500 rounded-xl p-6 text-white">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-xl font-bold mb-2">创作收益</h3>
            <p className="text-accent-100 text-sm">
              优秀作品可获得收益分成，让创作成为你的收入来源
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-xl font-bold mb-2">榜单曝光</h3>
            <p className="text-orange-100 text-sm">
              精彩作品登上首页推荐和各类榜单，获得更多曝光机会
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="text-3xl mb-3">🎁</div>
            <h3 className="text-xl font-bold mb-2">创作激励</h3>
            <p className="text-green-100 text-sm">
              定期举办创作活动，提供奖金和流量扶持
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-xl font-bold mb-2">粉丝社区</h3>
            <p className="text-pink-100 text-sm">
              建立自己的粉丝群体，与读者深度互动
            </p>
          </div>

          <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl p-6 text-white">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-xl font-bold mb-2">IP孵化</h3>
            <p className="text-indigo-100 text-sm">
              优质IP有机会获得影视、漫画等改编机会
            </p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-ink-50 dark:bg-ink-600 rounded-xl">
          <h3 className="text-xl font-bold text-ink-800 dark:text-white mb-3">
            成长路径
          </h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-3 py-1 bg-accent-100 dark:bg-accent-500/15 text-accent-600 dark:text-accent-300 rounded-full">新晋作者</span>
            <span className="text-ink-400">→</span>
            <span className="px-3 py-1 bg-accent-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">潜力新星</span>
            <span className="text-ink-400">→</span>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">签约作者</span>
            <span className="text-ink-400">→</span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">品牌作者</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/story/create"
            className="inline-flex items-center px-8 py-4 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors"
          >
            开始创作
          </a>
        </div>
      </div>
    </div>
  );
};

export default AuthorBenefitsPage;
