import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Database,
  LayoutGrid,
  Languages,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppScreen } from '../types/app';

const SCREEN_SUBTITLES: Record<AppScreen, { fa: string; en: string }> = {
  chat: { fa: 'دستیار هوشمند کدنویسی', en: 'AI Coding Companion' },
  repos: { fa: 'مدیریت مخازن گیت‌هاب', en: 'GitHub Repositories' },
  'repo-details': { fa: 'جزئیات مخزن و مرورگر کد', en: 'Repository Explorer' },
  'pr-review': { fa: 'بازبینی و تحلیل Pull Request', en: 'Pull Request AI Review' },
  security: { fa: 'ممیزی امنیتی و آسیب‌پذیری‌ها', en: 'Security & SAST Audit' },
  snippets: { fa: 'کتابخانه تکه‌کدها', en: 'Code Snippets Library' },
  analytics: { fa: 'مانیتورینگ توکن و هزینه‌ها', en: 'Token & Cost Analytics' },
  'cache-details': { fa: 'جزئیات کش هوشمند کانتکست', en: 'Smart Context Caching' },
  settings: { fa: 'تنظیمات، API و هشدارها', en: 'Settings, API & Alerts' },
};

export const TopAppBar: React.FC = () => {
  const {
    currentScreen,
    canGoBack,
    goBack,
    navigate,
    setLauncherOpen,
    settings,
    toggleLanguage,
    isRtl,
    t,
  } = useApp();

  const isStackDetail =
    currentScreen === 'repo-details' ||
    currentScreen === 'cache-details' ||
    currentScreen === 'analytics';

  const hasLiveKeys = Boolean(
    settings.geminiApiKey.trim() || settings.githubToken.trim()
  );

  const sub = SCREEN_SUBTITLES[currentScreen];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] pt-safe border-b border-white/[0.05]">
      <div className="h-16 px-4 max-w-3xl mx-auto flex items-center justify-between gap-2">
        {/* Leading: Back button or Brand Logo */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isStackDetail && canGoBack ? (
            <button
              type="button"
              onClick={goBack}
              title={t('بازگشت', 'Back')}
              className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary-container active:scale-95 transition-all shrink-0"
            >
              {isRtl ? (
                <ArrowRight className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLauncherOpen(true)}
              className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 cyber-border active:scale-95 transition-all"
              title={t('منوی صفحات برنامه', 'All App Screens')}
            >
              <img
                src={`${import.meta.env.BASE_URL}app-icon.svg`}
                alt="GitHub Agent"
                className="w-7 h-7 object-contain"
              />
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-display text-[15px] font-bold text-on-surface truncate">
                {t('دستیار من', 'My Assistant')}
              </span>
              <span className="text-outline-variant text-xs">|</span>
              <span
                className="font-display text-[13px] font-bold text-primary-fixed-dim truncate"
                dir="ltr"
              >
                GitHub Agent
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-mono text-on-surface-variant truncate">
                {t(sub.fa, sub.en)}
              </span>
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                  hasLiveKeys
                    ? 'bg-primary-container animate-pulse'
                    : 'bg-secondary'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Trailing Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live/Demo Pill on wider mobile */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-[10px] font-mono">
            <Sparkles className="w-3.5 h-3.5 text-primary-container" />
            <span className="text-on-surface-variant">
              {settings.geminiApiKey.trim() ? 'Gemini Live' : 'Gemini Demo'}
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <Terminal className="w-3.5 h-3.5 text-secondary" />
            <span className="text-on-surface-variant">
              {settings.githubToken.trim() ? 'PAT' : 'Git'}
            </span>
          </div>

          {/* Context Cache Shortcut */}
          <button
            type="button"
            onClick={() => navigate('cache-details')}
            title={t('حافظه کش هوشمند', 'Smart Context Cache')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
              currentScreen === 'cache-details'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container text-on-surface-variant hover:text-primary-container'
            }`}
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Token Analytics Shortcut */}
          <button
            type="button"
            onClick={() => navigate('analytics')}
            title={t('تحلیل مصرف توکن و هزینه', 'Token & Cost Analytics')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
              currentScreen === 'analytics'
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-surface-container text-on-surface-variant hover:text-primary-container'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={t('تغییر زبان به انگلیسی', 'Switch to Persian')}
            className="h-9 px-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center gap-1 active:scale-95 transition-all text-on-surface-variant hover:text-primary"
          >
            <Languages className="w-4 h-4 text-primary-container" />
            <span className="font-mono text-[10px] font-semibold text-primary-container">
              {settings.language === 'fa' ? 'FA' : 'EN'}
            </span>
          </button>

          {/* All Screens Launcher */}
          <button
            type="button"
            onClick={() => setLauncherOpen(true)}
            title={t('همه صفحات برنامه', 'All Screens')}
            className="w-9 h-9 rounded-xl bg-secondary-container/40 text-secondary hover:bg-secondary-container/60 flex items-center justify-center active:scale-95 transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
