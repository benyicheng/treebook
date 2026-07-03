import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Modal, Spinner, Button, Input, Textarea, Select } from '../../components/ui';
import { Copy, Twitter, Facebook, MessageCircle, Edit3, X, Share2 } from 'lucide-react';
import BooklistHeader from './components/BooklistHeader';
import BooklistOverviewTab from './components/BooklistOverviewTab';
import BooklistContentTab from './components/BooklistContentTab';
import BooklistBranchTab from './components/BooklistBranchTab';
import BooklistSpinoffTab from './components/BooklistSpinoffTab';
import BooklistWikiTab from './components/BooklistWikiTab';
import BooklistGraphTab from './components/BooklistGraphTab';
import BooklistEventTab from './components/BooklistEventTab';
import AddItemDrawer from './components/AddItemDrawer';
import CreateEventModal from './components/CreateEventModal';
import { ReadingDrawer } from '../../components/Booklist';
import { useBooklistDetail } from './hooks/useBooklistDetail';

const BooklistDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    booklist,
    isLoading,
    stats,
    editForm,
    setEditForm,
    deleteItem,
    setDeleteItem,
    editingItem,
    setEditingItem,
    itemNotes,
    setItemNotes,
    mainlineOrder,
    isCreator,
    booklistProgress,
    existingIds,
    handleToggleLike,
    handleShare,
    handleUpdateBooklist,
    handleDeleteBooklist,
    handleUpdateItemNotes,
    handleRemoveItem,
    handleBatchAdd,
    handleEventCreated,
    handleRemoveEvent,
    handleEditEventNotes,
    handleDragEnd,
    wikiPagesQuery,
    updateBooklist,
    deleteBooklist,
    removeFromBooklist,
    updateBooklistItem,
    refetchBooklist,
  } = useBooklistDetail(id);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const showAllPaths = searchParams.get('expandPaths') === 'true';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [defaultAddTab, setDefaultAddTab] = useState<'chapter' | 'story' | 'branch' | 'spinoff' | 'event' | 'wiki'>('chapter');

  const b = (booklist as any) || {};

  const tabs = [
    { id: 'overview', label: '概览', icon: '📋' },
    { id: 'content', label: '章节', icon: '📖' },
    { id: 'branch', label: '分支', icon: '🌿' },
    { id: 'spinoff', label: '番外', icon: '✨' },
    { id: 'wiki', label: '百科', icon: '📚' },
    { id: 'graph', label: '图谱', icon: '🔗' },
    { id: 'event', label: '大事件', icon: '📅' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <BooklistOverviewTab booklist={booklist} setActiveTab={setActiveTab} showAllPaths={showAllPaths} onTogglePaths={() => {
          const current = searchParams.get('expandPaths') === 'true';
          const nextParams = { ...Object.fromEntries(searchParams) };
          if (current) {
            delete nextParams.expandPaths;
          } else {
            nextParams.expandPaths = 'true';
          }
          setSearchParams(nextParams);
        }} />;
      case 'content':
        return (
          <BooklistContentTab
            booklist={booklist}
            booklistId={id ?? ''}
            isCreator={isCreator}
            mainlineOrder={mainlineOrder}
            progress={booklistProgress}
            onEditItem={(item) => { setEditingItem(item); setItemNotes(item.notes || ''); }}
            onRemoveItem={handleRemoveItem}
            onDragEnd={handleDragEnd}
            onAddItem={() => setIsAddDrawerOpen(true)}
          />
        );
      case 'branch':
        return <BooklistBranchTab booklist={booklist} />;
      case 'spinoff':
        return <BooklistSpinoffTab booklist={booklist} booklistId={id ?? ''} />;
      case 'wiki':
        return <BooklistWikiTab booklist={booklist} wikiPages={wikiPagesQuery.data || []} />;
      case 'graph':
        return <BooklistGraphTab booklist={booklist} booklistId={id ?? ''} isCreator={!!isCreator} />;
      case 'event':
        return (
          <BooklistEventTab
            booklist={booklist}
            isCreator={isCreator}
            onEditNotes={(item) => { setEditingItem(item); setItemNotes(item.notes || ''); }}
            onRemove={handleRemoveEvent}
            onAddEvent={() => { setIsAddDrawerOpen(true); setDefaultAddTab('event'); }}
            onCreateEvent={() => { setIsAddDrawerOpen(false); setIsCreateEventModalOpen(true); }}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-accent-500" />
      </div>
    );
  }

  if (!booklist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <MessageCircle className="w-16 h-16 text-ink-300 mb-4" />
        <p className="text-ink-500">书单不存在或已被删除</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BooklistHeader
        booklist={booklist}
        stats={stats}
        isCreator={isCreator}
        onToggleLike={handleToggleLike}
        onShare={() => setIsShareModalOpen(true)}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
        onViewPaths={() => setSearchParams({ tab: 'overview', expandPaths: 'true' })}
        activeTab={activeTab}
        onExpandPaths={() => setSearchParams({ tab: activeTab, expandPaths: 'true' })}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl whitespace-nowrap font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-600 text-white shadow-lg shadow-accent-500/30'
                  : 'bg-white dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:bg-accent-50 dark:hover:bg-ink-600 border border-ink-100 dark:border-ink-600'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Share Modal */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="分享">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '复制链接', icon: Copy, action: () => handleShare('copy') },
            { label: 'Twitter', icon: Twitter, action: () => handleShare('twitter') },
            { label: 'Facebook', icon: Facebook, action: () => handleShare('facebook') },
            { label: '微信', icon: MessageCircle, action: () => handleShare('wechat') },
          ].map(({ label, icon: Icon, action }) => (
            <Button key={label} onClick={action} variant="subtle" leftIcon={<Icon size={18} />}>
              {label}
            </Button>
          ))}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="编辑书单">
        <form onSubmit={(e) => { handleUpdateBooklist(e); setIsEditModalOpen(false); }} className="space-y-4">
          <Input
            value={editForm.title}
            onChange={e => setEditForm(s => ({ ...s, title: e.target.value }))}
            placeholder="书单标题"
            required
          />
          <Textarea className="resize-none"
            rows={3} value={editForm.description} onChange={e => setEditForm(s => ({ ...s, description: e.target.value }))} placeholder="书单描述" />
          <Textarea className="resize-none font-mono text-sm"
            rows={8} value={editForm.content} onChange={e => setEditForm(s => ({ ...s, content: e.target.value }))} placeholder="导读正文 (Markdown)&#10;&#10;可以在这里写故事背景介绍、结构分析、阅读视角解读等。&#10;使用 [[百科条目名]] 引用百科词条。" />
          <div className="flex gap-3">
            <Select
              value={editForm.type} onChange={e => setEditForm(s => ({ ...s, type: e.target.value }))}>
              <option value="COLLECTION">精选合集</option>
              <option value="TIMELINE">时空导览</option>
            </Select>
          </div>
          <Input
            value={editForm.tags} onChange={e => setEditForm(s => ({ ...s, tags: e.target.value }))} placeholder="标签 (逗号分隔)" />
          <Button type="submit" variant="primary" fullWidth loading={updateBooklist.isPending}>
            {updateBooklist.isPending ? '保存中...' : '保存'}
          </Button>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="确认删除">
        <p className="text-ink-500 mb-6">删除后无法恢复，确定要删除这个书单吗？</p>
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={() => setIsDeleteModalOpen(false)}>取消</Button>
          <Button variant="danger" fullWidth loading={deleteBooklist.isPending}
            onClick={() => { handleDeleteBooklist(); setIsDeleteModalOpen(false); }}>
            {deleteBooklist.isPending ? '删除中...' : '确认删除'}
          </Button>
        </div>
      </Modal>

      {/* 通用条目删除确认 */}
      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="确认删除">
        <p className="text-ink-500 mb-6">
          删除后无法恢复，确定要从书单移除「{deleteItem?.title}」吗？
        </p>
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={() => setDeleteItem(null)}>
            取消
          </Button>
          <Button variant="danger" fullWidth loading={removeFromBooklist.isPending}
            onClick={() => deleteItem?.onConfirm()}>
            {removeFromBooklist.isPending ? '删除中...' : '确认删除'}
          </Button>
        </div>
      </Modal>

      {/* Edit Item Notes Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="编辑点评">
        <Textarea className="resize-none"
          rows={3} value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="添加导游点评..." />
        <Button variant="primary" fullWidth loading={updateBooklistItem.isPending} className="mt-4"
          onClick={handleUpdateItemNotes}>
          {updateBooklistItem.isPending ? '保存中...' : '保存'}
        </Button>
      </Modal>

      {/* Add Item Drawer */}
      <AddItemDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => { setIsAddDrawerOpen(false); setDefaultAddTab('chapter'); }}
        existingIds={existingIds}
        onSubmit={handleBatchAdd}
        onOpenCreateEvent={() => setIsCreateEventModalOpen(true)}
        defaultTab={defaultAddTab}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onCreated={handleEventCreated}
      />

      {/* Reading Drawer */}
      <ReadingDrawer />
    </div>
  );
};

export default BooklistDetailPage;