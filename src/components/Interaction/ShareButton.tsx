import React, { useState, useCallback } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { interactionService, SharePlatform, TargetType } from '../../api/interactionService';
import { useToast } from '../notifications/Toast';
import Modal from '../ui/Modal';
import { Textarea, Button } from '../ui';

// 平台配置
const PLATFORMS: { id: SharePlatform; name: string; icon: string; color: string }[] = [
  { id: 'wechat', name: '微信', icon: '💬', color: 'bg-green-500' },
  { id: 'weibo', name: '微博', icon: '📢', color: 'bg-red-500' },
  { id: 'qq', name: 'QQ', icon: '🐧', color: 'bg-accent-400' },
  { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-500' },
  { id: 'copy', name: '复制链接', icon: '🔗', color: 'bg-ink-500' },
];

// 生成二维码SVG
const generateQRCode = (text: string): string => {
  // 使用 Google Chart API 生成二维码
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
};

interface ShareButtonProps {
  targetType: TargetType;
  targetId: string;
  title: string;
  description: string;
  imageUrl?: string;
  initialCount?: number;
  onShare?: (platform: SharePlatform, count: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'ghost';
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  targetType,
  targetId,
  title,
  description,
  imageUrl,
  initialCount = 0,
  onShare,
  size = 'md',
  showCount = false,
  variant = 'default',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWechatModalOpen, setIsWechatModalOpen] = useState(false);
  const [shareCount, setShareCount] = useState(initialCount);
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<SharePlatform | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const { addToast } = useToast();

  const sizeClasses = {
    sm: { button: 'p-1.5', icon: 14, count: 'text-xs' },
    md: { button: 'p-2', icon: 18, count: 'text-sm' },
    lg: { button: 'p-3', icon: 24, count: 'text-base' },
  };

  const classes = sizeClasses[size];

  const handleShare = useCallback(async (platform: SharePlatform) => {
    setSelectedPlatform(platform);
    setSharing(true);

    const shareText = customText || `推荐给你：${title}`;

    const config = interactionService.generateShareConfig(
      platform,
      targetType,
      targetId,
      shareText,
      description,
      imageUrl
    );

    // 微信分享特殊处理 - 显示二维码
    if (platform === 'wechat') {
      setQrCodeUrl(generateQRCode(config.url));
      setIsWechatModalOpen(true);
      setIsModalOpen(false);

      // 记录分享
      try {
        const result = await interactionService.recordShare(targetType, targetId, platform);
        setShareCount(result.shareCount);
        onShare?.(platform, result.shareCount);
      } catch (error) {
        console.error('Failed to record share:', error);
        addToast('error', '分享记录失败，请稍后重试');
      } finally {
        setSharing(false);
      }
      return;
    }

    try {
      const success = await interactionService.executeShare(config);

      if (success) {
        try {
          // 记录分享
          const result = await interactionService.recordShare(targetType, targetId, platform);
          setShareCount(result.shareCount);
          onShare?.(platform, result.shareCount);

          if (platform === 'copy') {
            setCopied(true);
            addToast('success', '链接已复制到剪贴板');
            setTimeout(() => setCopied(false), 2000);
          } else {
            setIsModalOpen(false);
          }
        } catch (error) {
          console.error('Failed to record share:', error);
          addToast('error', '分享记录失败，请稍后重试');
        }
      } else {
        addToast('error', '分享失败，请稍后重试');
      }
    } catch (error) {
      console.error('Share failed:', error);
      addToast('error', '分享失败，请稍后重试');
    } finally {
      setSharing(false);
    }
  }, [customText, title, description, imageUrl, targetType, targetId, onShare, addToast]);

  const getSharePath = (type: TargetType) => {
    switch (type) {
      case 'story': return 'story';
      case 'chapter': return 'read';
      case 'booklist': return 'booklist';
      case 'spinoff': return 'spinoff';
      case 'event': return 'events';
      default: return '';
    }
  };

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/${getSharePath(targetType)}/${targetId}`;

  return (
    <>
      <motion.button
        onClick={() => setIsModalOpen(true)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        className={`
          flex items-center gap-1.5 rounded-full transition-all duration-200
          ${classes.button}
          text-ink-400 hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10
        `}
      >
        <Share2 size={classes.icon} />
        {showCount && (
          <span className={`font-bold ${classes.count}`}>
            {shareCount.toLocaleString()}
          </span>
        )}
      </motion.button>

      {/* 分享弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="分享给朋友"
      >
        <div className="space-y-6">
          {/* 预览卡片 */}
          <div className="p-4 bg-ink-50 dark:bg-ink-800 rounded-2xl">
            <div className="flex gap-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-20 h-20 object-cover rounded-xl"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-ink-800 dark:text-white truncate">
                  {title}
                </h4>
                <p className="text-sm text-ink-500 line-clamp-2 mt-1">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* 自定义文案 */}
          <div>
            <label className="text-sm font-bold text-ink-500 mb-2 block">
              分享文案 (可选)
            </label>
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={`推荐给你：${title}`}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* 平台选择 */}
          <div>
            <label className="text-sm font-bold text-ink-500 mb-3 block">
              选择平台
            </label>
            <div className="grid grid-cols-5 gap-3">
              {PLATFORMS.map((platform) => (
                <motion.button
                  key={platform.id}
                  onClick={() => handleShare(platform.id)}
                  disabled={sharing}
                  whileHover={sharing ? undefined : { scale: 1.05 }}
                  whileTap={sharing ? undefined : { scale: 0.95 }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                    sharing && selectedPlatform === platform.id
                      ? 'bg-ink-50 dark:bg-ink-700 opacity-60'
                      : 'hover:bg-ink-50 dark:hover:bg-ink-700'
                  } ${sharing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`relative w-12 h-12 ${platform.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                    {sharing && selectedPlatform === platform.id ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      platform.icon
                    )}
                  </div>
                  <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                    {platform.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 链接复制区域 */}
          <div className="flex items-center gap-2 p-3 bg-ink-100 dark:bg-ink-700 rounded-xl">
            <Link2 size={16} className="text-ink-400 shrink-0" />
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-ink-500 dark:text-ink-400 outline-none"
            />
            <Button
              size="sm"
              onClick={() => handleShare('copy')}
              className={copied ? 'bg-green-500 text-white' : ''}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <Check size={14} />
                  已复制
                </span>
              ) : (
                '复制'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 微信分享二维码弹窗 */}
      <Modal
        isOpen={isWechatModalOpen}
        onClose={() => setIsWechatModalOpen(false)}
        title="微信扫码分享"
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
            <img
              src={qrCodeUrl}
              alt="微信分享二维码"
              className="w-48 h-48"
              onError={(e) => {
                // 二维码加载失败时显示备用提示
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div className="text-center space-y-2">
            <p className="text-ink-500 dark:text-ink-400">
              打开微信扫一扫，分享给你的好友
            </p>
            <p className="text-sm text-ink-400">
              或在微信中长按识别二维码
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-ink-100 dark:bg-ink-700 rounded-xl w-full">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-ink-500 dark:text-ink-400 outline-none"
            />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                addToast('success', '链接已复制到剪贴板');
              }}
              className="bg-green-500 hover:bg-green-600"
            >
              复制链接
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ShareButton;
