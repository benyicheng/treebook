import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { Mail, Lock, User, PlusCircle, ArrowLeft, AlertCircle, BookOpen, GitBranch, Eye } from 'lucide-react';
import { Button, Input } from '../../components/ui';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'reader' as 'reader' | 'author',
    uiRole: 'reader' as 'reader' | 'contributor' | 'author',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      // Remove uiRole before sending to API
      const { uiRole, ...submitData } = formData;
      await register(submitData);
      navigate('/');
    } catch (err: any) {
      setLocalError(err.response?.data?.message || '注册失败，请稍后再试');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-ink-50 dark:bg-ink-700 p-10 rounded-3xl shadow-2xl border border-ink-100 dark:border-ink-600 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-ink-400 hover:text-accent-500 transition-colors mb-4">
            <ArrowLeft size={16} />
            返回首页
          </Link>
          <h1 className="text-3xl font-black text-ink-800 dark:text-white tracking-tight">加入平行宇宙</h1>
          <p className="text-ink-500 dark:text-ink-400 font-light">开启你的多人协作写作之旅</p>
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
              <label className="flex items-center gap-2 text-xs font-black text-ink-400 uppercase tracking-widest px-1">
                <Mail size={14} />
                电子邮箱
              </label>
              <Input
                type="email"
                required
                size="lg"
                className="rounded-2xl"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-ink-400 uppercase tracking-widest px-1">
                <User size={14} />
                用户名
              </label>
              <Input
                type="text"
                required
                size="lg"
                className="rounded-2xl"
                placeholder="例如：银河漫游者"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-ink-400 uppercase tracking-widest px-1">
                <Lock size={14} />
                登录密码
              </label>
              <Input
                type="password"
                required
                size="lg"
                className="rounded-2xl"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-ink-400 uppercase tracking-widest px-1">
                身份角色
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'reader', uiRole: 'reader' }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    formData.uiRole === 'reader' 
                      ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/5 text-accent-500 dark:text-accent-400' 
                      : 'border-ink-100 dark:border-ink-600 hover:border-accent-200 text-ink-500 dark:text-ink-400'
                  }`}
                >
                  <Eye size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">星空读者</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'reader', uiRole: 'contributor' }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    formData.uiRole === 'contributor' 
                      ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/5 text-accent-500 dark:text-accent-400' 
                      : 'border-ink-100 dark:border-ink-600 hover:border-accent-200 text-ink-500 dark:text-ink-400'
                  }`}
                >
                  <GitBranch size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">社区创作者</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: 'author', uiRole: 'author' }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    formData.uiRole === 'author' 
                      ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/5 text-accent-500 dark:text-accent-400' 
                      : 'border-ink-100 dark:border-ink-600 hover:border-accent-200 text-ink-500 dark:text-ink-400'
                  }`}
                >
                  <BookOpen size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">官方作者</span>
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            leftIcon={<PlusCircle size={20} />}
            className="rounded-2xl h-auto py-4 text-lg font-black shadow-xl hover:shadow-accent-400/20"
          >
            立即注册
          </Button>
        </form>

        <div className="pt-6 text-center border-t border-ink-100 dark:border-ink-600">
          <p className="text-ink-500 dark:text-ink-400 text-sm">
            已经有账号了？{' '}
            <Link to="/login" className="text-accent-500 font-black hover:underline">立即登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
