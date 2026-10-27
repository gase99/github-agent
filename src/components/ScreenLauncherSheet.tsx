import React from 'react';
import {
  BarChart3,
  Bot,
  Code2,
  Database,
  FileCode2,
  FolderGit2,
  GitPullRequest,
  ShieldAlert,
  SlidersHorizontal,
  Smartphone,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPlatformLabel } from '../services/nativeBridge';
import type { AppScreen } from '../types/app';

export const ScreenLauncherSheet: React.FC = () => {
  const { isLauncherOpen, setLauncherOpen, currentScreen, navigate, t } = useApp();

  if (!isLauncherOpen) return null;

  const cards: Array<{
    screen: AppScreen;
    code: string;
    titleFa: string;
    titleEn: string;
    descFa: string;
    descEn: string;
    icon: React.FC<{ className?: string }>;
    accent: string;
  }> = [
    {
      screen: 'chat',
      code: '01 / CHAT',
      titleFa: 'دستیار هوشمند AI',
      titleEn: 'AI Coding Chat',
      descFa: 'گفت‌وگو و استریم زنده با Gemini',
      descEn: 'Live Gemini chat & code assistant',
      icon: Bot,
      accent: 'text-primary-container',
    },
    {
      screen: 'repos',
      code: '02 / REPOS',
      titleFa: 'فهرست مخازن گیت‌هاب',
      titleEn: 'GitHub Repositories',
      descFa: 'همگام‌سازی و جستجوی مخازن',
      descEn: 'Sync & filter GitHub repos',
      icon: FolderGit2,
      accent: 'text-primary-fixed-dim',
    },
    {
      screen: 'repo-details',
      code: '03 / EXPLORER',
      titleFa: 'جزئیات مخزن و فایل‌ها',
      titleEn: 'Repository Explorer',
      descFa: 'درخت فایل‌ها، کدخوان و تحلیل AI',
      descEn: 'File tree, code viewer & AI tools',
      icon: FileCode2,
      accent: 'text-secondary',
    },
    {
      screen: 'pr-review',
      code: '04 / PR REVIEW',
      titleFa: 'بازبینی Pull Request',
      titleEn: 'PR Diff & AI Audit',
      descFa: 'نمایش Diff و پیشنهاد درجای کد',
      descEn: 'Interactive diff & inline AI fixes',
      icon: GitPullRequest,
      accent: 'text-secondary',
    },
    {
      screen: 'security',
      code: '05 / SECURITY',
      titleFa: 'ممیزی امنیتی SAST',
      titleEn: 'Security & CVE Audit',
      descFa: 'کشف نشت کلید، CVE و اصلاح خودکار',
      descEn: 'Secrets, dependencies & Auto-Fix',
      icon: ShieldAlert,
      accent: 'text-error',
    },
    {
      screen: 'snippets',
      code: '06 / SNIPPETS',
      titleFa: 'کتابخانه تکه‌کدها',
      titleEn: 'Code Snippets',
      descFa: 'ذخیره، اشتراک و بهینه‌سازی کدها',
      descEn: 'Save, filter & AI-optimize code',
      icon: Code2,
      accent: 'text-primary-container',
    },
    {
      screen: 'analytics',
      code: '07 / ANALYTICS',
      titleFa: 'تحلیل توکن و هزینه',
      titleEn: 'Token & Cost Analytics',
      descFa: 'نمودار مصرف هفتگی و سهمیه API',
      descEn: 'Quota gauges & weekly breakdown',
      icon: BarChart3,
      accent: 'text-primary-fixed',
    },
    {
      screen: 'cache-details',
      code: '08 / CACHE',
      titleFa: 'کش هوشمند کانتکست',
      titleEn: 'Context Caching & TTL',
      descFa: 'مدیریت حافظه کش و شبیه‌ساز هزینه',
      descEn: 'Cache artifacts, TTL & cost simulator',
      icon: Database,
      accent: 'text-secondary',
    },
    {
      screen: 'settings',
      code: '09 / SETTINGS',
      titleFa: 'تنظیمات API، بودجه و هشدار',
      titleEn: 'API, Budget & Alerts',
      descFa: 'کلیدهای Gemini/GitHub، تلگرام و پیامک',
      descEn: 'Keys, TTL, Telegram & SMS alerts',
      icon: SlidersHorizontal,
      accent: 'text-primary-container',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setLauncherOpen(false)}
    >
      <div
        className="w-full max-w-2xl max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-container-low p-4 sm:p-5 shadow-2xl cyber-border pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                {t('مرکز ماژول‌های GitHub Agent', 'GitHub Agent Command Hub')}
              </h2>
              <p className="text-[11px] font-mono text-on-surface-variant" dir="ltr">
                {getPlatformLabel()} • 9 Integrated Modules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLauncherOpen(false)}
            className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {cards.map((c) => {
            const Icon = c.icon;
            const active = currentScreen === c.screen;
            return (
              <button
                key={c.screen}
                type="button"
                onClick={() => navigate(c.screen)}
                className={`text-start p-3 rounded-2xl transition-all active:scale-98 flex flex-col gap-1.5 ${
                  active
                    ? 'bg-surface-container-high cyber-glow-cyan'
                    : 'bg-surface-container hover:bg-surface-container-high cyber-border-subtle'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-[10px] text-secondary font-semibold" dir="ltr">
                    {c.code}
                  </span>
                  <Icon className={`w-4 h-4 ${c.accent}`} />
                </div>
                <span className="font-display text-sm font-bold text-on-surface">
                  {t(c.titleFa, c.titleEn)}
                </span>
                <span className="text-xs text-on-surface-variant leading-snug">
                  {t(c.descFa, c.descEn)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
