import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-accent-50 dark:bg-accent-800/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Compass size={36} className="text-accent-500" />
        </div>
        <h1 className="text-6xl font-black text-ink-200 dark:text-ink-700 mb-4">404</h1>
        <h2 className="text-xl font-bold text-ink-800 dark:text-white mb-3">
          这个宇宙不存在
        </h2>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-8 leading-relaxed">
          你试图访问的页面不在当前叙事线上。也许它存在于另一个平行宇宙，也许它从未被创造。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
          >
            <Home size={16} /> 返回首页
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink-100 hover:bg-ink-200 dark:bg-ink-700 dark:hover:bg-ink-600 text-ink-600 dark:text-ink-300 rounded-2xl font-bold text-sm transition-all active:scale-95"
          >
            <ArrowLeft size={16} /> 后退
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
