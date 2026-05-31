import React, { useState } from 'react';
import { useSiteConfigStore } from '../../stores/useSiteConfigStore';
import ReactMarkdown from 'react-markdown';

const HelpPage: React.FC = () => {
  const { config } = useSiteConfigStore();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const faqItems = [
    {
      question: '如何创建一个主线故事？',
      answer: '登录后进入「创作中心」，点击「创作故事」按钮，填写故事的基本信息（标题、封面、简介等），然后开始编写章节。发布后，你的故事就上线了！'
    },
    {
      question: '如何创建平行分支？',
      answer: '在阅读任何章节时，点击页面下方的「创建平行分支」按钮，选择该章节作为分叉点，然后编写你的分支剧情。分支创建后，读者可以看到从主线到分支的完整路径。'
    },
    {
      question: '我可以删除别人基于我故事创建的分支吗？',
      answer: '是的，作为主线作者，你有权管理所有基于该主线创建的分支。你可以在主线页的「平行宇宙」标签中查看所有分支，并对分支进行管理。'
    },
    {
      question: '如何发布番外作品？',
      answer: '在主线页或分支页，点击「发布番外」按钮，填写番外标题和内容。番外会关联到原故事，读者可以轻松找到所有番外作品。'
    },
    {
      question: '书单是什么？如何创建书单？',
      answer: '书单是收藏和管理喜爱章节的功能。你可以在阅读任何章节时点击「加入书单」，或者进入书单页面创建新的书单。书单可以分享给其他用户。'
    },
    {
      question: '如何修改已发布的内容？',
      answer: '进入「创作中心」，找到你的作品列表，点击「编辑」按钮即可修改内容。分支和番外也可以在对应的页面进行编辑。'
    },
    {
      question: '遇到bug或功能异常怎么办？',
      answer: '请通过「意见反馈」页面向我们报告问题，我们会尽快处理。详细描述问题现象、复现步骤，有助于我们更快定位和解决问题。'
    },
    {
      question: '如何获得创作收益？',
      answer: '当你的作品阅读量和粉丝数达到一定标准后，可以申请成为签约作者，享受收益分成。具体政策请查看「作者福利」页面。'
    },
    {
      question: '可以删除自己的账号吗？',
      answer: '可以。进入「个人设置」，选择「账号安全」，点击「注销账号」按钮。注意：注销账号后，你的所有作品将被删除，此操作不可恢复。'
    },
    {
      question: '如何联系客服？',
      answer: '您可以通过「联系我们」页面获取联系方式，或者通过「意见反馈」功能提交问题，我们会尽快回复。'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-ink-700 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white mb-8">
          常见问题
        </h1>

        {config.pageHelp && (
          <div className="prose prose-lg dark:prose-invert max-w-none mb-8 pb-8 border-b border-ink-100 dark:border-ink-700">
            <ReactMarkdown>{config.pageHelp}</ReactMarkdown>
          </div>
        )}

        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-ink-200 dark:border-ink-600 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedItem(expandedItem === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-ink-50 dark:hover:bg-ink-600/50 transition-colors"
              >
                <span className="font-bold text-ink-800 dark:text-white">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 text-ink-500 transform transition-transform ${
                    expandedItem === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {expandedItem === index && (
                <div className="px-6 pb-4 text-ink-500 dark:text-ink-300">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-ink-50 dark:bg-ink-600 rounded-xl">
          <p className="text-sm text-ink-500 dark:text-ink-300 mb-3">
            没有找到你需要的答案？
          </p>
          <a
            href="/feedback"
            className="inline-flex items-center px-4 py-2 bg-accent-400 hover:bg-accent-500 text-white text-sm font-bold rounded-lg transition-colors"
          >
            提交问题
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
