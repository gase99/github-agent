import React, { useEffect, useState } from 'react';
import {
  Bot,
  Code2,
  Download,
  GitPullRequest,
  Receipt,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchGithubRateQuota, type GithubRateQuota } from '../services/githubApi';
import { copyText } from '../services/nativeBridge';

export const TokenAnalyticsScreen: React.FC = () => {
  const {
    totalTokensUsed,
    tokenEvents,
    settings,
    navigate,
    showToast,
    t,
  } = useApp();

  const [range, setRange] = useState<'today' | '7d' | '30d' | 'billing'>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [ghQuota, setGhQuota] = useState<GithubRateQuota>({
    coreUsed: 18,
    coreLimit: 60,
    searchUsed: 3,
    searchLimit: 10,
    graphqlUsed: 0,
    graphqlLimit: 60,
    resetMinutes: 28,
  });

  const loadGithubQuota = async () => {
    setRefreshing(true);
    const live = await fetchGithubRateQuota(settings.githubToken);
    if (live) setGhQuota(live);
    setTimeout(() => setRefreshing(false), 450);
  };

  useEffect(() => {
    loadGithubQuota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.githubToken]);

  const multiplier = range === 'today' ? 0.18 : range === '7d' ? 1 : range === '30d' ? 3.2 : 4.1;
  const displayedTokens = Math.round(totalTokensUsed * multiplier);
  const maxQuotaTokens = 2_000_000 * (range === '30d' || range === 'billing' ? 4 : 1);
  const quotaPct = Math.min(98, Math.max(5, Math.round((displayedTokens / maxQuotaTokens) * 100)));
  const estimatedCost = Number(((displayedTokens / 1_000_000) * 3.0).toFixed(2));
  const budgetPct = Math.min(100, Math.round((estimatedCost / settings.monthlyBudgetCap) * 100));

  const circumference = 251.3;
  const dashOffset = circumference * (1 - quotaPct / 100);

  const weeklyDays = [
    { fa: 'ش', en: 'Sat', inPct: 32, outPct: 18 },
    { fa: 'ی', en: 'Sun', inPct: 25, outPct: 14 },
    { fa: 'د', en: 'Mon', inPct: 40, outPct: 22 },
    { fa: 'س', en: 'Tue', inPct: 48, outPct: 26 },
    { fa: 'چ', en: 'Wed', inPct: 52, outPct: 38, peak: true },
    { fa: 'پ', en: 'Thu', inPct: 34, outPct: 20 },
    { fa: 'ج', en: 'Fri', inPct: 18, outPct: 12 },
  ];

  const handleExport = async () => {
    const report = JSON.stringify(
      {
        range,
        displayedTokens,
        estimatedCostUsd: estimatedCost,
        monthlyBudgetCapUsd: settings.monthlyBudgetCap,
        githubRateQuota: ghQuota,
        recentEvents: tokenEvents,
      },
      null,
      2
    );
    await copyText(report);
    showToast(
      t('گزارش JSON مصرف توکن در کلیپ‌بورد کپی شد ✓', 'Analytics JSON report copied ✓'),
      'cyan'
    );
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-12 gap-4">
      {/* Header & Range Filters */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-base font-bold text-on-surface">
              {t('تحلیل مصرف توکن و سهمیه API', 'Token & Quota Analytics')}
            </h1>
            <p className="text-[11px] font-mono text-primary-container">
              {t('مانیتورینگ زنده Gemini و GitHub API', 'Live Gemini & GitHub telemetry')}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadGithubQuota}
              className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary-container active:scale-90"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="h-9 px-3 rounded-xl bg-surface-container flex items-center gap-1.5 text-xs font-mono text-on-surface-variant hover:text-primary-container active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('خروجی', 'Export')}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'today', fa: 'امروز (Today)', en: 'Today' },
            { id: '7d', fa: '۷ روز اخیر (7 Days)', en: '7 Days' },
            { id: '30d', fa: '۳۰ روز اخیر (30 Days)', en: '30 Days' },
            { id: 'billing', fa: 'چرخه صورت‌حساب', en: 'Billing Cycle' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id as typeof range)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all ${
                range === r.id
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(0,245,212,0.3)]'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t(r.fa, r.en)}
            </button>
          ))}
        </div>
      </div>

      {/* Quota Overview & Radial Gauge */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-xl cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                {t('سهمیه کل جمینای', 'Gemini Token Quota')}
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant" dir="ltr">
                {settings.geminiModel}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary-container font-mono text-[10px] font-semibold">
            {t('جریان بهینه', 'Optimal')}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-5 flex flex-col items-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1d1f29" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#00f5d4"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl font-bold text-on-surface font-mono">
                  {quotaPct}%
                </span>
                <span className="text-[9px] text-on-surface-variant">
                  {t('مصرف‌شده', 'Used')}
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-7 space-y-2.5">
            <div className="bg-surface-container p-2.5 rounded-xl">
              <span className="text-[10px] text-on-surface-variant block">
                {t('توکن مصرف‌شده / سقف کل', 'Tokens Used / Quota')}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5 font-mono" dir="ltr">
                <span className="text-base font-bold text-primary">
                  {(displayedTokens / 1_000_000).toFixed(2)}M
                </span>
                <span className="text-xs text-outline">
                  / {(maxQuotaTokens / 1_000_000).toFixed(1)}M
                </span>
              </div>
            </div>

            <div className="bg-surface-container p-2.5 rounded-xl">
              <div className="flex justify-between text-[10px]">
                <span className="text-on-surface-variant">
                  {t('برآورد هزینه جاری', 'Estimated Cost')}
                </span>
                <span className="font-mono text-secondary">{budgetPct}%</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5 font-mono" dir="ltr">
                <span className="text-base font-bold text-secondary">${estimatedCost}</span>
                <span className="text-[11px] text-outline">
                  / ${settings.monthlyBudgetCap} Cap
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-secondary h-full rounded-full transition-all"
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Input / Output Stacked Bar Chart */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-xl cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-on-surface">
              {t('روند هفتگی مصرف توکن', 'Weekly Token Consumption')}
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              {t('تفکیک ورودی (Prompt) و خروجی (Completion)', 'Prompt Input vs Completion Output')}
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]" dir="ltr">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-container" /> Input
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" /> Output
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 h-36 pt-5 px-2 pb-1 bg-surface-container-lowest/70 rounded-xl">
          {weeklyDays.map((d, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full max-w-[28px] flex flex-col gap-0.5 items-center justify-end h-full">
                <div
                  className={`w-full rounded-t-sm bg-secondary ${
                    d.peak ? 'shadow-[0_0_10px_rgba(224,182,255,0.45)]' : ''
                  }`}
                  style={{ height: `${d.outPct}%` }}
                />
                <div
                  className={`w-full rounded-b-sm bg-primary-container ${
                    d.peak ? 'shadow-[0_0_10px_rgba(0,245,212,0.45)]' : ''
                  }`}
                  style={{ height: `${d.inPct}%` }}
                />
              </div>
              <span
                className={`text-[10px] font-mono ${
                  d.peak ? 'text-primary-container font-bold' : 'text-outline'
                }`}
              >
                {t(d.fa, d.en)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Capability Breakdown */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-xl cyber-border-subtle space-y-2.5">
        <h2 className="font-display text-sm font-bold text-on-surface">
          {t('سهم ماژول‌ها از مصرف توکن', 'Consumption by Capability')}
        </h2>
        {[
          {
            icon: GitPullRequest,
            fa: 'بازبینی کد و تحلیل PR',
            en: 'Pull Request Review',
            tok: '580k tok',
            pct: 41,
            bar: 'bg-primary-container',
            text: 'text-primary-container',
          },
          {
            icon: Bot,
            fa: 'دستیار چت هوش مصنوعی',
            en: 'AI Chat & Debugging',
            tok: '420k tok',
            pct: 30,
            bar: 'bg-secondary',
            text: 'text-secondary',
          },
          {
            icon: ShieldAlert,
            fa: 'اسکن امنیتی SAST',
            en: 'Security & Vulnerability Audit',
            tok: '280k tok',
            pct: 20,
            bar: 'bg-error',
            text: 'text-error',
          },
          {
            icon: Code2,
            fa: 'تولید و بهینه‌سازی تکه‌کدها',
            en: 'Snippet Generation',
            tok: '140k tok',
            pct: 9,
            bar: 'bg-tertiary-fixed-dim',
            text: 'text-tertiary-fixed-dim',
          },
        ].map((cap, i) => {
          const Icon = cap.icon;
          return (
            <div key={i} className="bg-surface-container p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${cap.text}`} />
                  <span className="text-xs font-semibold text-on-surface">
                    {t(cap.fa, cap.en)}
                  </span>
                </div>
                <span className="font-mono text-xs text-on-surface" dir="ltr">
                  {cap.tok} ({cap.pct}%)
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div className={`${cap.bar} h-full rounded-full`} style={{ width: `${cap.pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Live GitHub API Quota Widget */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-xl cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-secondary" />
            <h2 className="font-display text-sm font-bold text-on-surface">
              {t('سهمیه زنده GitHub API', 'Live GitHub API Rate Limits')}
            </h2>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-primary-fixed-dim" dir="ltr">
            Reset in {ghQuota.resetMinutes}m
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2" dir="ltr">
          <div className="bg-surface-container p-2.5 rounded-xl">
            <span className="font-mono text-[10px] text-outline block">Core REST</span>
            <span className="font-mono text-sm font-bold text-primary">
              {ghQuota.coreLimit - ghQuota.coreUsed}
            </span>
            <span className="font-mono text-[10px] text-outline block">
              / {ghQuota.coreLimit} left
            </span>
          </div>
          <div className="bg-surface-container p-2.5 rounded-xl">
            <span className="font-mono text-[10px] text-outline block">Search API</span>
            <span className="font-mono text-sm font-bold text-secondary">
              {ghQuota.searchLimit - ghQuota.searchUsed}
            </span>
            <span className="font-mono text-[10px] text-outline block">
              / {ghQuota.searchLimit} req/m
            </span>
          </div>
          <div className="bg-surface-container p-2.5 rounded-xl">
            <span className="font-mono text-[10px] text-outline block">GraphQL</span>
            <span className="font-mono text-sm font-bold text-tertiary-fixed-dim">
              {ghQuota.graphqlLimit - ghQuota.graphqlUsed}
            </span>
            <span className="font-mono text-[10px] text-outline block">
              / {ghQuota.graphqlLimit} pts
            </span>
          </div>
        </div>
      </section>

      {/* Smart Cache Advisor Card */}
      <section className="rounded-2xl bg-gradient-to-br from-surface-container-low via-surface-container to-secondary-container/25 p-4 shadow-xl cyber-border space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-secondary-fixed">
              {t('پیشنهاد هوشمند Context Caching', 'Gemini Context Caching Advisor')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {t(
                'با مدیریت حافظه کش هوشمند روی سورس مخزن و قوانین ممیزی، تا ۷۵٪ در هزینه توکن‌های ورودی صرفه‌جویی کنید.',
                'Save up to 75% on repeated repository input tokens using Gemini Context Caching.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate('cache-details')}
            className="py-2 px-3 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{t('مدیریت کش هوشمند', 'Context Cache')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('settings')}
            className="py-2 px-3 rounded-xl bg-surface-container-high text-on-surface text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('سقف بودجه و هشدار', 'Budget Alerts')}</span>
          </button>
        </div>
      </section>

      {/* Recent High-Consumption Events */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-xl cyber-border-subtle space-y-2.5">
        <div className="flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-outline" />
          <h2 className="font-display text-sm font-bold text-on-surface">
            {t('رویدادهای مصرف اخیر', 'Recent Telemetry Log')}
          </h2>
        </div>

        <div className="space-y-2">
          {tokenEvents.slice(0, 6).map((ev) => (
            <div
              key={ev.id}
              className="bg-surface-container p-3 rounded-xl flex items-center justify-between gap-2"
              dir="ltr"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-on-surface truncate">
                    {ev.title}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-[9px] font-mono text-primary">
                    {ev.modelBadge}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-outline">
                  {ev.timeAgo} • {ev.latencyLabel}
                </span>
              </div>
              <div className="text-right shrink-0 font-mono">
                <span className="text-xs font-bold text-primary block">
                  {ev.tokens.toLocaleString()} tok
                </span>
                <span className="text-[10px] text-outline">~${ev.costUsd}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
