import React, { useState } from 'react';
import { characterService } from '../../api/characterService';
import { aiService } from '../../api/aiService';
import type { Character } from '../../api/types';
import { useCharacters, useCreateCharacter, useUpdateCharacter } from '../../hooks/useCharacters';
import { useAuthStore } from '../../stores/useAuthStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Plus, Trash2, Edit3, X, Save, Sparkles, Loader2 } from 'lucide-react';
import { Modal } from '../../components/ui';
import { queryKeys } from '../../lib/queryKeys';

import { useToast } from '../../components/notifications';

interface CharacterManagerProps {
  storyId: string;
  isAuthor: boolean;
}

const CharacterManager: React.FC<CharacterManagerProps> = ({ storyId, isAuthor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { addToast } = useToast();

  const { data: characters = [], isLoading } = useCharacters(storyId);
  const createCharMutation = useCreateCharacter();
  const updateCharMutation = useUpdateCharacter();
  const qc = useQueryClient();
  const deleteCharMutation = useMutation({
    mutationFn: (id: string) => characterService.deleteCharacter(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.characters.byStory(storyId) }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChar) return;

    setIsSubmitting(true);
    try {
      if (editingChar.id) {
        await updateCharMutation.mutateAsync({ charId: editingChar.id, data: editingChar });
      } else {
        await createCharMutation.mutateAsync({ storyId, data: editingChar });
      }
      setIsModalOpen(false);
      setEditingChar(null);
    } catch (err) {
      addToast('error', '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!editingChar?.name || !editingChar?.description) {
      addToast('warning', '请先填写角色姓名和描述，AI 将根据这些信息生成形象');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const prompt = `A professional character portrait of ${editingChar.name}, who is described as: ${editingChar.description}. High quality, cinematic lighting, 4k.`;
      const result = await aiService.generateImage(prompt);
      
      setEditingChar(prev => ({
        ...prev!,
        avatarUrl: result.imageUrl
      }));
    } catch (err) {
      addToast('error', 'AI 生成失败，请稍后重试');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该角色？')) return;
    try {
      await deleteCharMutation.mutateAsync(id);
    } catch (err) {
      addToast('error', '删除失败');
    }
  };

  const openModal = (char?: Character) => {
    setEditingChar(char || {
      name: '',
      description: '',
      role: 'supporting',
      avatarUrl: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-2xl font-black text-ink-800 dark:text-white">角色档案</h3>
        {isAuthor && (
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600 transition-all shadow-lg shadow-accent-400/20 active:scale-95"
          >
            <Plus size={16} />
            添加角色
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-ink-100 dark:bg-ink-700 rounded-3xl animate-pulse"></div>
          ))
        ) : characters.length > 0 ? (
          characters.map((char: Character) => (
            <div key={char.id} className="group relative bg-ink-50 dark:bg-ink-700 p-6 rounded-3xl border border-ink-100 dark:border-ink-600 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-ink-200 dark:bg-ink-600 overflow-hidden shrink-0">
                  {char.avatarUrl ? (
                    <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-lg font-black text-ink-800 dark:text-white truncate">{char.name}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      char.role === 'protagonist' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                      char.role === 'antagonist' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      'bg-accent-100 dark:bg-accent-500/15 text-accent-500'
                    }`}>
                      {char.role === 'protagonist' ? '主角' : char.role === 'antagonist' ? '反派' : '配角'}
                    </span>
                  </div>
                  <p className="text-sm text-ink-500 dark:text-ink-400 line-clamp-2 font-medium">{char.description}</p>
                </div>
              </div>
              
              {isAuthor && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(char)}
                    className="p-2 bg-ink-50 dark:bg-ink-600 text-accent-500 rounded-xl shadow-sm hover:scale-110 transition-transform"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(char.id)}
                    className="p-2 bg-ink-50 dark:bg-ink-600 text-red-600 rounded-xl shadow-sm hover:scale-110 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-ink-50 dark:bg-ink-700/50 rounded-3xl border-2 border-dashed border-ink-200 dark:border-ink-600">
            <User size={40} className="mx-auto text-ink-300 mb-4" />
            <p className="text-ink-500 font-medium">暂无角色档案</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChar?.id ? '编辑角色' : '添加新角色'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink-500 uppercase">角色头像</label>
              <div className="w-24 h-24 bg-ink-100 dark:bg-ink-700 rounded-2xl flex items-center justify-center text-ink-400 shrink-0 border border-dashed border-ink-300 dark:border-ink-500 relative overflow-hidden group">
                {editingChar?.avatarUrl ? (
                  <img src={editingChar.avatarUrl} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <User size={32} />
                )}
                {isGeneratingImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={isGeneratingImage}
                onClick={handleGenerateAvatar}
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-gradient-to-r from-purple-500 to-accent-400 text-white text-[10px] font-black rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingImage ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI 生成形象
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-500 uppercase">角色姓名</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all"
                  value={editingChar?.name}
                  onChange={e => setEditingChar(prev => ({ ...prev!, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink-500 uppercase">角色定位</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all"
                  value={editingChar?.role}
                  onChange={e => setEditingChar(prev => ({ ...prev!, role: e.target.value as any }))}
                >
                  <option value="protagonist">主角</option>
                  <option value="antagonist">反派</option>
                  <option value="supporting">配角</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-500 uppercase">人物小传</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-ink-100 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 focus:ring-2 focus:ring-accent-400 outline-none transition-all resize-none"
              placeholder="描述角色的性格、背景故事... (AI 将参考此描述生成形象)"
              value={editingChar?.description || ''}
              onChange={e => setEditingChar(prev => ({ ...prev!, description: e.target.value }))}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300 rounded-xl font-bold hover:bg-ink-200 dark:hover:bg-ink-600 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isGeneratingImage}
              className="flex-1 py-3 bg-accent-500 text-white rounded-xl font-bold hover:bg-accent-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存档案'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CharacterManager;
