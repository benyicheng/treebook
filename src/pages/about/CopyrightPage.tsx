import React from 'react';
import { useSiteConfigStore } from '../../stores/useSiteConfigStore';
import ReactMarkdown from 'react-markdown';

const CopyrightPage: React.FC = () => {
  const { config } = useSiteConfigStore();

  if (config.pageCopyright) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{config.pageCopyright}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">
          版权保护声明
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              原创保护
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              平行宇宙严格保护原创作者的合法权益。所有在平台发布的内容均受到著作权法保护。
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
              <li>作者对其创作的作品拥有完整的著作权</li>
              <li>平台为每部作品提供创作时间戳和版权证明</li>
              <li>未经授权，任何人不得抄袭、复制、转载平台作品</li>
              <li>作者可以随时举报侵权行为，平台将严肃处理</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              分支创作权
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              分支创作是平行宇宙的核心特色，我们明确分支创作的权责边界：
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
              <li>分支作者拥有对自己分支内容的著作权</li>
              <li>分支创作必须基于原著的授权（平台默认授权）</li>
              <li>分支不得损害原著的声誉和形象</li>
              <li>分支不得用于商业用途（需获得原作者书面授权）</li>
              <li>原著作者有权管理基于自己作品的所有分支</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              侵权投诉
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              如果您发现平台上有内容侵犯了您的权益，请通过举报中心进行投诉。
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                投诉时请提供以下信息：
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm">
                <li>您的身份证明和版权证明</li>
                <li>侵权内容的链接和位置</li>
                <li>侵权事实的详细说明</li>
                <li>您的联系方式</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              违规处理
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              对于侵权行为，平台将采取以下措施：
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
              <li>立即下架侵权内容</li>
              <li>警告侵权用户，情节严重者封禁账号</li>
              <li>配合司法机关处理侵权案件</li>
              <li>将严重侵权者列入黑名单</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>提示：</strong>请广大作者和读者共同维护健康的创作环境，尊重原创，拒绝盗版。
          </p>
        </div>
      </div>
    </div>
  );
};

export default CopyrightPage;
