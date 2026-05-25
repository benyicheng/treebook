import React from 'react';
import { useSiteConfigStore } from '../../stores/useSiteConfigStore';
import ReactMarkdown from 'react-markdown';

const AuthorGuidePage: React.FC = () => {
  const { config } = useSiteConfigStore();

  if (config.pageCreationGuide) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{config.pageCreationGuide}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">
          创作指南
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm mr-3">1</span>
              创建主线故事
            </h2>
            <div className="ml-11">
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                主线故事是整个平行宇宙的核心。发布主线后，其他作者可以在任意章节创建分支。
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>进入「创作中心」，点击「创作故事」</li>
                <li>填写故事标题、封面、简介等基本信息</li>
                <li>开始编写章节内容</li>
                <li>发布后故事将自动开放分支创建权限</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center text-sm mr-3">2</span>
              创建平行分支
            </h2>
            <div className="ml-11">
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                在阅读故事时，如果你对某个章节有不同的想法，可以创建分支剧情。
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>在阅读页点击「创建平行分支」</li>
                <li>选择当前章节作为分叉点</li>
                <li>填写分支标题和你的新剧情</li>
                <li>分支创建后，读者可以看到主线到分支的完整路径</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm mr-3">3</span>
              发布番外作品
            </h2>
            <div className="ml-11">
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                番外是对主线故事的延伸和补充，可以是前传、后传、番外篇等。
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>在主线页或分支页点击「发布番外」</li>
                <li>填写番外标题和内容</li>
                <li>番外会关联到原故事，读者可以轻松找到</li>
                <li>番外作品也会获得独立的阅读量和推荐</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center text-sm mr-3">4</span>
              权限说明
            </h2>
            <div className="ml-11">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>主线作者：</strong>可以管理所有基于该主线创建的分支</li>
                <li><strong>分支作者：</strong>拥有对自己分支的完整控制权</li>
                <li><strong>番外作者：</strong>拥有番外作品的管理权限</li>
                <li><strong>管理员：</strong>拥有所有内容的管理权限</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-8 h-8 bg-gray-500 text-white rounded-lg flex items-center justify-center text-sm mr-3">5</span>
              创作建议
            </h2>
            <div className="ml-11">
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>保持主线故事的连贯性和完整性</li>
                <li>分支创作时，尊重原著的基本设定</li>
                <li>番外作品可以自由发挥，丰富世界观</li>
                <li>积极与读者互动，收集反馈改进作品</li>
                <li>遵守平台规则，尊重他人创作</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthorGuidePage;
