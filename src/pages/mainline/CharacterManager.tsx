import React, { useState, useEffect } from 'react';
import { storyService, aiService, Character } from '../../api/storyService';
import { useAuthStore } from '../../stores/useAuthStore';
import { User, Plus, Trash2, Edit3, X, Save, Sparkles, Loader2 } from 'lucide-react';
import Modal from '../../components/Modal';

interface CharacterManagerProps {
  storyId: string;
  isAuthor: boolean;
}

const CharacterManager: React.FC<CharacterManagerProps> = ({ storyId, isAuthor }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, [storyId]);

  const fetchCharacters = async () => {
    setIsLoading(true);
    try {
      const data = await storyService.getCharacters(storyId);
      setCharacters(data);
    } catch (err) {
      console.error('Failed to fetch characters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChar) return;

    setIsSubmitting(true);
    try {
      if (editingChar.id) {
        await storyService.updateCharacter(editingChar.id, editingChar);
      } else {
        await storyService.createCharacter(storyId, editingChar);
      }
      setIsModalOpen(false);
      setEditingChar(null);
      fetchCharacters();
    } catch (err) {
      alert('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!editingChar?.name || !editingChar?.description) {
      alert('请先填写角色姓名和描述，AI 将根据这些信息生成形象');
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
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该角色？')) return;
    try {
      await storyService.deleteCharacter(id);
      setCharacters(characters.filter(c => c.id !== id));
    } catch (err) {
      alert('删除失败');
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
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">角色档案</h3>
        {isAuthor && (
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus size={16} />
            添加角色
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse"></div>
          ))
        ) : characters.length > 0 ? (
          characters.map(char => (
            <div key={char.id} className="group relative bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                  {char.avatarUrl ? (
                    <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={32} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-lg font-black text-gray-900 dark:text-white truncate">{char.name}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      char.role === 'protagonist' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                      char.role === 'antagonist' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                    }`}>
                      {char.role === 'protagonist' ? '主角' : char.role === 'antagonist' ? '反派' : '配角'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 font-medium">{char.description}</p>
                </div>
              </div>
              
              {isAuthor && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openModal(char)}
                    className="p-2 bg-white dark:bg-gray-700 text-blue-600 rounded-xl shadow-sm hover:scale-110 transition-transform"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(char.id)}
                    className="p-2 bg-white dark:bg-gray-700 text-red-600 rounded-xl shadow-sm hover:scale-110 transition-transform"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <User size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">暂无角色档案</p>
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
              <label className="text-xs font-bold text-gray-500 uppercase">角色头像</label>
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 shrink-0 border border-dashed border-gray-300 dark:border-gray-600 relative overflow-hidden group">
                {editingChar?.avatarUrl ? (
                  <img src={editingChar.avatarUrl} className="w-full h-full object-cover" />
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
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-black rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingImage ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI 生成形象
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">角色姓名</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={editingChar?.name}
                  onChange={e => setEditingChar(prev => ({ ...prev!, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">角色定位</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
            <label className="text-xs font-bold text-gray-500 uppercase">人物小传</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              placeholder="描述角色的性格、背景故事... (AI 将参考此描述生成形象)"
              value={editingChar?.description || ''}
              onChange={e => setEditingChar(prev => ({ ...prev!, description: e.target.value }))}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isGeneratingImage}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
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
