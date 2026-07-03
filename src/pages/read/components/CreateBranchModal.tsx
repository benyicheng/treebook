import React from 'react';
import { Modal, Button, Input, Textarea } from '../../../components/ui';
import { GitBranch } from 'lucide-react';

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: any;
  branchForm: { title: string; description: string };
  onBranchFormChange: (field: 'title' | 'description', value: string) => void;
  isCreating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  isOpen,
  onClose,
  chapter,
  branchForm,
  onBranchFormChange,
  isCreating,
  onSubmit,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建平行宇宙分支">
      <form onSubmit={onSubmit} className="space-y-6 p-6">
        <div className="p-4 bg-accent-50 dark:bg-accent-800/10 rounded-lg border border-accent-100 dark:border-accent-800/20">
          <p className="text-xs font-bold text-accent-600 mb-1">基于当前章节创建分支</p>
          <p className="text-[11px] text-accent-500/70">
            《{chapter?.story?.title}》— {chapter?.title}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-ink-500">分支标题 <span className="text-red-400">*</span></label>
          <Input
            type="text"
            required
            placeholder="给你的平行宇宙起个名字..."
            value={branchForm.title}
            onChange={(e) => onBranchFormChange('title', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-ink-500">分支描述 <span className="text-red-400">*</span></label>
          <Textarea
            required
            rows={4}
            className="resize-none"
            placeholder="描述这个分支的故事走向..."
            value={branchForm.description}
            onChange={(e) => onBranchFormChange('description', e.target.value)}
          />
        </div>

        <Button
          type="submit"
          loading={isCreating}
          fullWidth
          size="lg"
          leftIcon={<GitBranch size={18} />}
        >
          {isCreating ? '正在创建分支...' : '创建分支'}
        </Button>
      </form>
    </Modal>
  );
};

export default CreateBranchModal;