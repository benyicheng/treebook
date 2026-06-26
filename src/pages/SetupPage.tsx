import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, User, Mail, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../components/notifications';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api' 
  : `http://${window.location.hostname}:3001/api`;

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [needsInit, setNeedsInit] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    checkInitStatus();
  }, []);

  const checkInitStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/init/check`);
      if (!res.data.needsInit) {
        navigate('/');
      } else {
        setNeedsInit(true);
      }
    } catch (err) {
      setError('无法连接到后端服务器，请确保后端已启动。');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/init/setup`, {
        username: form.username,
        email: form.email,
        password: form.password
      });
      addToast('success', '初始化成功！请使用新创建的账号登录。');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || '初始化失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-600 rounded-3xl shadow-xl shadow-accent-200 mb-6 rotate-3">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">TREEBOOK INIT</h1>
          <p className="text-slate-500 font-medium">配置您的首个超级管理员账号</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-accent-100/50 p-8 border border-slate-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">管理员用户名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  required
                  placeholder="例如: admin"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-accent-600 focus:bg-white rounded-2xl transition-all font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                  value={form.username}
                  onChange={e => setForm({...form, username: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">管理邮箱</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-accent-600 focus:bg-white rounded-2xl transition-all font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">设置密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-accent-600 focus:bg-white rounded-2xl transition-all font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">确认密码</label>
              <div className="relative">
                <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-accent-600 focus:bg-white rounded-2xl transition-all font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                  value={form.confirmPassword}
                  onChange={e => setForm({...form, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent-600 hover:bg-accent-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-accent-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {submitting ? '正在初始化...' : (
                <>
                  完成系统配置
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-sm font-medium italic">
          注：初始化后，此页面将自动失效以确保系统安全。
        </p>
      </div>
    </div>
  );
};

export default SetupPage;
