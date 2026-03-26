import React, { useState } from 'react';

const FeedbackPage: React.FC = () => {
  const [formData, setFormData] = useState({
    type: 'suggestion',
    content: '',
    contact: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里应该调用API提交反馈
    console.log('Feedback submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
          意见反馈
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          我们非常重视您的意见和建议，您的反馈将帮助我们不断改进。
        </p>

        {submitted ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">
              提交成功
            </h3>
            <p className="text-green-600 dark:text-green-400 text-sm">
              感谢您的反馈！我们会认真对待每一条建议。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                反馈类型
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'suggestion', label: '建议' },
                  { value: 'bug', label: 'Bug反馈' },
                  { value: 'feature', label: '功能请求' },
                  { value: 'other', label: '其他' }
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      formData.type === type.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="sr-only"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                详细描述
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请详细描述您的建议或遇到的问题..."
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                联系方式（可选）
              </label>
              <input
                type="text"
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="邮箱或手机号，方便我们回复您"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
            >
              提交反馈
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            其他反馈渠道
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>• 邮箱：feedback@paralleluniverse.com</p>
            <p>• 微信：paralleluniverse_support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
