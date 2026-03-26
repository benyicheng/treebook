import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Mail, Lock, LogIn, ArrowLeft, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(formData);
      navigate('/');
    } catch (err: any) {
      setLocalError(err.response?.data?.message || '登录失败，请检查邮箱和密码');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors mb-4">
            <ArrowLeft size={16} />
            返回首页
          </Link>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">欢迎回来</h1>
          <p className="text-gray-500 dark:text-gray-400 font-light">继续你的平行宇宙之旅</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(error || localError) && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl flex gap-3 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 animate-in shake duration-300">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{localError || error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                <Mail size={14} />
                电子邮箱
              </label>
              <input 
                type="email"
                required
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                <Lock size={14} />
                登录密码
              </label>
              <input 
                type="password"
                required
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn size={20} />
                立即登录
              </>
            )}
          </button>
        </form>

        <div className="pt-6 text-center border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            还没有账号？{' '}
            <Link to="/register" className="text-blue-600 font-black hover:underline">立即注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
