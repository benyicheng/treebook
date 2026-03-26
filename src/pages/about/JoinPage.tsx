import React from 'react';
import { Link } from 'react-router-dom';

const JoinPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">
          加入我们
        </h1>

        <div className="mb-8">
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            平行宇宙正在快速发展，我们正在寻找对故事创作充满热情的人才加入我们的团队。
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              全栈开发工程师
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
              <p><strong>职责：</strong>负责平台功能开发和维护，参与系统架构设计</p>
              <p><strong>要求：</strong>熟练掌握 React、Node.js、TypeScript，有大型项目经验</p>
              <p><strong>地点：</strong>远程 / 北京</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              产品经理
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
              <p><strong>职责：</strong>负责产品规划和用户体验优化，收集用户需求</p>
              <p><strong>要求：</strong>有社区产品或内容平台经验，对故事创作有热情</p>
              <p><strong>地点：</strong>北京 / 上海</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              内容运营
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
              <p><strong>职责：</strong>负责优质内容发掘、作者关系维护、活动策划执行</p>
              <p><strong>要求：</strong>有文学或创作背景，具备良好的沟通能力和审美</p>
              <p><strong>地点：</strong>远程</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            如何申请
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            请将您的简历发送至：jobs@paralleluniverse.com
          </p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            邮件标题格式：应聘职位 - 姓名
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
