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
      <div className="bg-white dark:bg-ink-700 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white mb-2">
          意见反馈
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mb-8">
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
              <label className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
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
                        ? 'bg-accent-400 text-white'
                        : 'bg-ink-100 dark:bg-ink-600 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-500'
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
              <label htmlFor="content" className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                详细描述
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请详细描述您的建议或遇到的问题..."
                rows={6}
                className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
                required
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                联系方式（可选）
              </label>
              <input
                type="text"
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="邮箱或手机号，方便我们回复您"
                className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-accent-400 hover:bg-accent-500 text-white font-bold rounded-xl transition-colors"
            >
              提交反馈
            </button>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-ink-200 dark:border-ink-600">
          <h3 className="text-sm font-bold text-ink-800 dark:text-white mb-3">
            其他反馈渠道
          </h3>
          <div className="space-y-2 text-sm text-ink-500 dark:text-ink-300">
            <p>• 邮箱：feedback@paralleluniverse.com</p>
            <p>• 微信：paralleluniverse_support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
