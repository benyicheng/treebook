import React from 'react';

interface Props {
  children: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class FeatureErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const featureName = this.props.name || '此功能';

    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-ink-800 dark:text-white mb-1">{featureName}加载异常</h3>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
          请刷新重试，或联系开发者
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 text-sm font-bold text-accent-500 bg-accent-50 dark:bg-accent-500/10 rounded-xl hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-colors"
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-bold text-ink-600 dark:text-ink-300 bg-ink-100 dark:bg-ink-700 rounded-xl hover:bg-ink-200 dark:hover:bg-ink-600 transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    );
  }
}
