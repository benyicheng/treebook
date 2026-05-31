import React from 'react';

const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-ink-700 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white mb-8">
          联系我们
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-4">
              客服支持
            </h2>
            <div className="space-y-4">
              <div className="bg-ink-50 dark:bg-ink-600 rounded-xl p-4">
                <h3 className="font-bold text-ink-800 dark:text-white mb-2">在线客服</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm">
                  工作时间：周一至周五 9:00-18:00
                </p>
              </div>
              <div className="bg-ink-50 dark:bg-ink-600 rounded-xl p-4">
                <h3 className="font-bold text-ink-800 dark:text-white mb-2">电子邮件</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm">
                  support@paralleluniverse.com
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-4">
              商务合作
            </h2>
            <div className="space-y-4">
              <div className="bg-ink-50 dark:bg-ink-600 rounded-xl p-4">
                <h3 className="font-bold text-ink-800 dark:text-white mb-2">商务邮箱</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm">
                  business@paralleluniverse.com
                </p>
              </div>
              <div className="bg-ink-50 dark:bg-ink-600 rounded-xl p-4">
                <h3 className="font-bold text-ink-800 dark:text-white mb-2">合作类型</h3>
                <p className="text-ink-500 dark:text-ink-300 text-sm">
                  IP授权、内容合作、广告投放
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-ink-200 dark:border-ink-600">
          <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-4">
            意见反馈
          </h2>
          <p className="text-ink-500 dark:text-ink-300 mb-4">
            如果你有任何建议或意见，欢迎通过我们的反馈渠道告知我们。
          </p>
          <a
            href="/feedback"
            className="inline-flex items-center px-6 py-3 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors"
          >
            提交反馈
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
