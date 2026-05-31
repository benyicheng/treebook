import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
  }

  private buildErrorText() {
    const { error, errorInfo } = this.state;
    const title = error?.name ? `${error.name}: ${error.message}` : 'Unknown error';
    const stack = error?.stack || '';
    const componentStack = errorInfo?.componentStack || '';
    return [title, stack, componentStack].filter(Boolean).join('\n\n');
  }

  private async copyError() {
    const text = this.buildErrorText();
    try {
      await navigator.clipboard.writeText(text);
      alert('错误信息已复制');
    } catch {
      alert(text);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full bg-ink-50 dark:bg-ink-800 rounded-3xl border border-ink-100 dark:border-ink-700 shadow-sm p-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs font-black text-ink-400 uppercase tracking-widest">发生错误</div>
            <h1 className="text-2xl font-black text-ink-800 dark:text-white">页面渲染失败</h1>
            <p className="text-ink-500 dark:text-ink-400 text-sm">
              你可以刷新重试，或复制错误信息反馈给开发者。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-accent-500 text-white rounded-2xl font-black hover:bg-accent-600 transition-all active:scale-95"
            >
              刷新重试
            </button>
            <button
              onClick={() => void this.copyError()}
              className="flex-1 px-6 py-3 bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-white rounded-2xl font-black hover:bg-ink-200 dark:hover:bg-ink-600 transition-all active:scale-95"
            >
              复制错误信息
            </button>
          </div>
        </div>
      </div>
    );
  }
}

