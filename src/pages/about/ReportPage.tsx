import React, { useState } from 'react';

const ReportPage: React.FC = () => {
  const [formData, setFormData] = useState({
    type: '',
    targetType: '',
    targetUrl: '',
    reason: '',
    description: '',
    contact: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 这里应该调用API提交举报
    console.log('Report submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const reportTypes = [
    { value: 'copyright', label: '侵犯版权' },
    { value: 'spam', label: '垃圾广告' },
    { value: 'inappropriate', label: '不良内容' },
    { value: 'harassment', label: '骚扰辱骂' },
    { value: 'fraud', label: '欺诈行为' },
    { value: 'other', label: '其他违规' }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-ink-700 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-ink-800 dark:text-white mb-2">
          举报中心
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mb-8">
          发现违规内容？请立即举报，我们将严肃处理。
        </p>

        {submitted ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-2">
              举报已提交
            </h3>
            <p className="text-green-600 dark:text-green-400 text-sm">
              感谢您的举报！我们会尽快核实并处理。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                举报类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400"
                required
              >
                <option value="">请选择举报类型</option>
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                举报对象类型
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'story', label: '故事' },
                  { value: 'branch', label: '分支' },
                  { value: 'spinoff', label: '番外' },
                  { value: 'comment', label: '评论' }
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      formData.targetType === type.value
                        ? 'bg-accent-400 text-white'
                        : 'bg-ink-100 dark:bg-ink-600 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      value={type.value}
                      checked={formData.targetType === type.value}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                      className="sr-only"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="targetUrl" className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                链接地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="targetUrl"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder="请粘贴举报内容的完整链接"
                className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400"
                required
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                举报理由
              </label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="请简述举报理由..."
                rows={3}
                className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                详细说明 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请详细描述违规行为的具体情况，包括时间、地点、相关截图等..."
                rows={5}
                className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
                required
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-bold text-ink-800 dark:text-white mb-2">
                联系方式 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="请留下您的邮箱或手机号，以便我们跟进"
                className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-600 border border-ink-200 dark:border-ink-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-400"
                required
              />
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>提示：</strong>恶意举报将受到惩罚，请确保举报内容真实有效。
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
            >
              提交举报
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
