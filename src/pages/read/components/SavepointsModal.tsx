import React from 'react';
import { Modal } from '../../../components/ui';
import { Save, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavepointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: any;
  savepoints: any[];
  isSaving: boolean;
  saveSuccess: boolean;
  onCreateSavepoint: () => void;
  onDeleteSavepoint: (id: string) => void;
}

export const SavepointsModal: React.FC<SavepointsModalProps> = ({
  isOpen,
  onClose,
  chapter,
  savepoints,
  isSaving,
  saveSuccess,
  onCreateSavepoint,
  onDeleteSavepoint,
}) => {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="时空存档">
      <div className="space-y-6 p-6">
        <div className="p-4 bg-accent-50 dark:bg-accent-800/10 rounded-lg border border-accent-100 dark:border-accent-800/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-black text-accent-600 uppercase tracking-widest">当前位置</h4>
            {saveSuccess && (
              <span className="text-[10px] font-bold text-accent-500 animate-pulse">存档成功！</span>
            )}
          </div>
          <p className="text-[13px] font-bold text-ink-700 dark:text-ink-200 mb-4">{chapter?.title}</p>
          <button
            onClick={onCreateSavepoint}
            disabled={isSaving}
            className="w-full h-10 bg-accent-500 text-white rounded-lg text-sm font-bold hover:bg-accent-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? '正在记录时空坐标...' : '立即存档当前进度'}
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-black text-ink-400 uppercase tracking-widest px-1">历史存档点</h4>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {savepoints.length > 0 ? (
              savepoints.map((sp: any) => (
                <div
                  key={sp.id}
                  className="group flex items-center justify-between p-3 bg-ink-50 dark:bg-ink-700 rounded-lg border border-ink-100 dark:border-ink-600 hover:border-accent-200 transition-all"
                >
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => { navigate(`/read/${sp.chapterId}`); onClose(); }}
                  >
                    <h5 className="text-xs font-black text-ink-700 dark:text-ink-200 truncate group-hover:text-accent-600 transition-colors">
                      {sp.chapter?.title || '未知章节'}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-ink-400" />
                      <span className="text-[10px] text-ink-400 font-bold">
                        {new Date(sp.createdAt).toLocaleString()}
                      </span>
                      {sp.branch && (
                        <>
                          <span className="text-ink-300">·</span>
                          <span className="text-[10px] text-accent-500 font-bold italic">{sp.branch.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteSavepoint(sp.id)}
                    className="p-2 text-ink-300 hover:text-red-500 transition-colors"
                    title="删除存档"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-ink-400">
                <Clock size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">暂无历史存档</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SavepointsModal;