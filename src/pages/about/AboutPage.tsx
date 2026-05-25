import React from 'react';
import { useSiteConfigStore } from '../../stores/useSiteConfigStore';
import ReactMarkdown from 'react-markdown';

const AboutPage: React.FC = () => {
  const { config } = useSiteConfigStore();

  if (config.pageAboutUs) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{config.pageAboutUs}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">
          关于平行宇宙
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              我们的愿景
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              平行宇宙是一个开放的故事创作平台，我们相信每一个故事的结局都不是唯一的。
              在这里，作者可以发布主线故事，读者可以基于主线创建分支剧情，
              每一个分支都是一个新的平行宇宙，每一个选择都能展开不同的故事篇章。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              核心功能
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">●</span>
                <span><strong>主线故事</strong> - 作者创作的原创故事主线</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">●</span>
                <span><strong>平行分支</strong> - 基于主线章节创建的分支剧情</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">●</span>
                <span><strong>番外作品</strong> - 故事的衍生创作和番外篇</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">●</span>
                <span><strong>书单分享</strong> - 收藏和分享喜爱的章节</span>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              创作生态
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              我们致力于打造一个开放、包容的创作社区。在这里：
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• 原作者可以管理所有基于自己故事的分支创作</li>
              <li>• 分支作者享有自己分支的完整控制权</li>
              <li>• 番外作品可以为故事增添更多可能性</li>
              <li>• 书单系统帮助读者发现优质内容</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              加入我们
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              无论是创作故事、阅读评论，还是分享见解，平行宇宙都欢迎你的到来。
              开始你的平行宇宙之旅，发现无限可能的故事世界。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
