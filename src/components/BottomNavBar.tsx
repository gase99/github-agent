import React from 'react';
import {
  Bot,
  Code2,
  FolderGit2,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppScreen } from '../types/app';

export const BottomNavBar: React.FC = () => {
  const { currentScreen, navigate, t } = useApp();

  const items: Array<{
    id: AppScreen;
    match: AppScreen[];
    labelFa: string;
    labelEn: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      id: 'chat',
      match: ['chat'],
      labelFa: 'دستیار AI',
      labelEn: 'AI Chat',
      icon: Bot,
    },
    {
      id: 'repos',
      match: ['repos', 'repo-details'],
      labelFa: 'مخازن',
      labelEn: 'Repos',
      icon: FolderGit2,
    },
    {
      id: 'security',
      match: ['security', 'pr-review'],
      labelFa: 'امنیت و PR',
      labelEn: 'Audit & PR',
      icon: ShieldCheck,
    },
    {
      id: 'snippets',
      match: ['snippets'],
      labelFa: 'تکه‌کدها',
      labelEn: 'Snippets',
      icon: Code2,
    },
    {
      id: 'settings',
      match: ['settings', 'analytics', 'cache-details'],
      labelFa: 'تنظیمات',
      labelEn: 'Settings',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface-container-lowest/92 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] border-t border-white/[0.06]">
      <div className="flex justify-around items-center h-16 px-1 max-w-xl mx-auto">
        {items.map((item) => {
          const active = item.match.includes(currentScreen);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`min-w-[54px] min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all rounded-xl ${
                active
                  ? 'text-primary-container font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div
                className={`px-3 py-0.5 rounded-full transition-all ${
                  active ? 'bg-primary-container/15' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium tracking-tight truncate max-w-[72px]">
                {t(item.labelFa, item.labelEn)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
