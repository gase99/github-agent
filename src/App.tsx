import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { ScreenLauncherSheet } from './components/ScreenLauncherSheet';
import { ChatScreen } from './screens/ChatScreen';
import { RepositoriesScreen } from './screens/RepositoriesScreen';
import { RepoDetailsScreen } from './screens/RepoDetailsScreen';
import { PrReviewScreen } from './screens/PrReviewScreen';
import { SecurityAuditScreen } from './screens/SecurityAuditScreen';
import { SnippetsScreen } from './screens/SnippetsScreen';
import { TokenAnalyticsScreen } from './screens/TokenAnalyticsScreen';
import { ContextCacheScreen } from './screens/ContextCacheScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const AppShell: React.FC = () => {
  const { currentScreen, toast } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'chat':
        return <ChatScreen />;
      case 'repos':
        return <RepositoriesScreen />;
      case 'repo-details':
        return <RepoDetailsScreen />;
      case 'pr-review':
        return <PrReviewScreen />;
      case 'security':
        return <SecurityAuditScreen />;
      case 'snippets':
        return <SnippetsScreen />;
      case 'analytics':
        return <TokenAnalyticsScreen />;
      case 'cache-details':
        return <ContextCacheScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background text-on-surface relative overflow-x-hidden">
      {/* Subtle Cybernetic Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-28 -end-28 w-80 h-80 rounded-full bg-primary-container/[0.04] blur-3xl" />
        <div className="absolute top-1/3 -start-28 w-72 h-72 rounded-full bg-secondary/[0.04] blur-3xl" />
      </div>

      <TopAppBar />

      <main className="flex-1 flex flex-col relative z-10 pt-16 pb-20">
        {renderScreen()}
      </main>

      <BottomNavBar />

      <ScreenLauncherSheet />

      {/* Toast Notification Pill */}
      {toast && (
        <div className="fixed top-20 inset-x-0 z-[80] flex justify-center px-4 pointer-events-none">
          <div
            className={`px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium cyber-border transition-all ${
              toast.tone === 'error'
                ? 'bg-error-container/90 text-on-error-container'
                : toast.tone === 'purple'
                  ? 'bg-surface-container-highest/95 text-secondary'
                  : 'bg-surface-container-highest/95 text-primary-container'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : toast.tone === 'purple' ? (
              <Sparkles className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => (
  <AppProvider>
    <AppShell />
  </AppProvider>
);

export default App;
