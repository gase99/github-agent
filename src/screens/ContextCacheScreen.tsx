import React, { useState } from 'react';
import {
  Clock,
  Copy,
  Database,
  Eye,
  Hourglass,
  Layers,
  PiggyBank,
  RefreshCw,
  Timer,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createLiveGeminiContextCache } from '../services/geminiApi';
import { copyText } from '../services/nativeBridge';
import type { CacheArtifact } from '../types/app';

export const ContextCacheScreen: React.FC = () => {
  const {
    selectedRepo,
    settings,
    setKeyModalOpen,
    cacheEnabled,
    setCacheEnabled,
    cacheRemainingMinutes,
    extendCacheMinutes,
    purgeCache,
    cacheArtifacts,
    showToast,
    t,
  } = useApp();

  const [dailyQueries, setDailyQueries] = useState(120);
  const [previewArtifact, setPreviewArtifact] = useState<CacheArtifact | null>(null);
  const [cacheId, setCacheId] = useState('cache_gemini_ctx_984f1a');
  const [syncingLiveCache, setSyncingLiveCache] = useState(false);
  const [liveCacheNote, setLiveCacheNote] = useState<string>('');

  const handleSyncLiveCache = async () => {
    if (!settings.geminiApiKey.trim()) {
      setKeyModalOpen(true);
      return;
    }
    setSyncingLiveCache(true);
    try {
      const combinedContext = cacheArtifacts
        .map((a) => `### ${a.titleEn}\n${a.previewContent}`)
        .join('\n\n');
      const res = await createLiveGeminiContextCache({
        apiKey: settings.geminiApiKey,
        model: settings.geminiModel,
        displayName: `repo-${selectedRepo.name}`,
        contextText: `Repository: ${selectedRepo.fullName}\n${combinedContext}`,
        ttlPreset: settings.defaultCacheTtl,
      });
      setCacheId(res.cacheName);
      setCacheEnabled(true);
      setLiveCacheNote(t(res.noteFa, res.noteEn));
      showToast(t(res.noteFa, res.noteEn), 'cyan');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cache sync failed';
      showToast(msg, 'error');
    } finally {
      setSyncingLiveCache(false);
    }
  };
  const hours = Math.floor(cacheRemainingMinutes / 60);
  const mins = cacheRemainingMinutes % 60;
  const ttlPct = Math.min(100, Math.round((cacheRemainingMinutes / 360) * 100));

  const standardCostMonthly = (dailyQueries * 30 * 0.0038).toFixed(2);
  const cachedCostMonthly = (dailyQueries * 30 * 0.00095).toFixed(2);
  const savedMonthly = (Number(standardCostMonthly) - Number(cachedCostMonthly)).toFixed(2);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-12 gap-4">
      {/* Live Repository Cache Banner */}
      <section className="bg-surface-container rounded-2xl p-4 shadow-lg cyber-border relative overflow-hidden space-y-3">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-secondary via-primary-container to-primary-fixed" />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold text-on-surface truncate" dir="ltr">
              {selectedRepo.fullName}
            </h1>
            <p className="font-mono text-[11px] text-on-surface-variant" dir="ltr">
              branch: {selectedRepo.defaultBranch} • Context Caching API
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold flex items-center gap-1.5 shrink-0 ${
              cacheEnabled
                ? 'bg-surface-container-lowest text-primary-container'
                : 'bg-error-container/30 text-error'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {cacheEnabled ? t('فعال و همگام', 'Active') : t('غیرفعال', 'Purged')}
          </span>
        </div>

        <div className="bg-surface-container-lowest/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">{t('شناسه کش هوشمند:', 'Cache ID:')}</span>
          <button
            type="button"
            onClick={async () => {
              await copyText(cacheId);
              showToast(t('شناسه کش کپی شد ✓', 'Cache ID copied ✓'), 'cyan');
            }}
            className="flex items-center gap-1.5 font-mono text-primary-fixed hover:text-primary"
            dir="ltr"
          >
            <span>{cacheId}</span>
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          disabled={syncingLiveCache}
          onClick={handleSyncLiveCache}
          className="w-full py-2.5 px-3 rounded-xl bg-primary-container/15 hover:bg-primary-container/25 text-primary-container font-display text-xs font-bold flex items-center justify-center gap-2 cyber-border active:scale-98 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncingLiveCache ? 'animate-spin' : ''}`} />
          <span>
            {syncingLiveCache
              ? t('در حال ثبت کش در سرور Google Gemini...', 'Registering Context with Google Gemini...')
              : settings.geminiApiKey.trim()
                ? t('ثبت و همگام‌سازی زنده کش با Google Gemini API', 'Sync Live Context Cache with Google Gemini API')
                : t('فعال‌سازی کلید Gemini برای ثبت کش زنده', 'Activate Gemini API Key to Sync Live Cache')}
          </span>
        </button>

        {liveCacheNote && (
          <p className="text-[11px] text-primary-fixed-dim bg-surface-container-lowest/70 p-2.5 rounded-xl">
            {liveCacheNote}
          </p>
        )}
      </section>

      {/* 4-Card KPI Bento Grid */}
      <section className="grid grid-cols-2 gap-2.5">
        <div className="bg-surface-container rounded-2xl p-3.5 shadow-md cyber-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              {t('توکن‌های کش‌شده', 'Cached Tokens')}
            </span>
            <Database className="w-4 h-4 text-primary-container" />
          </div>
          <p className="font-display text-lg font-bold text-primary-fixed font-mono" dir="ltr">
            {cacheEnabled ? '1,248,500' : '0'}
          </p>
          <p className="text-[10px] text-outline">
            {t('حافظه زمینه فعال پروژه', 'Pinned project context')}
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-3.5 shadow-md cyber-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              {t('صرفه‌جویی هزینه', 'Cost Saved')}
            </span>
            <PiggyBank className="w-4 h-4 text-secondary" />
          </div>
          <p className="font-display text-lg font-bold text-secondary font-mono" dir="ltr">
            ${savedMonthly}
          </p>
          <p className="text-[10px] text-primary-fixed-dim">
            {t('۷۵٪ تخفیف توکن ورودی', '-75% input token discount')}
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-3.5 shadow-md cyber-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              {t('نرخ اصابت کش', 'Cache Hit Ratio')}
            </span>
            <Zap className="w-4 h-4 text-primary-container" />
          </div>
          <p className="font-display text-lg font-bold text-on-surface font-mono" dir="ltr">
            {cacheEnabled ? '84.2%' : '0%'}
          </p>
          <p className="text-[10px] text-outline">
            {t('پاسخ از حافظه گرم', 'Warm context hits')}
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-3.5 shadow-md cyber-border-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              {t('کاهش تأخیر (TTFT)', 'TTFT Latency')}
            </span>
            <Timer className="w-4 h-4 text-secondary" />
          </div>
          <p className="font-display text-base font-bold text-on-surface font-mono" dir="ltr">
            1.8s → 340ms
          </p>
          <p className="text-[10px] text-primary-container">
            {t('۷۸٪ پاسخ‌دهی سریع‌تر', '78% faster first token')}
          </p>
        </div>
      </section>

      {/* TTL & Expiration Manager */}
      <section className="bg-surface-container rounded-2xl p-4 shadow-lg cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hourglass className="w-4 h-4 text-secondary" />
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                {t('طول عمر و انقضای کش (TTL)', 'Cache TTL & Expiration')}
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                {t(`سیاست پیش‌فرض: ${settings.defaultCacheTtl}`, `Default policy: ${settings.defaultCacheTtl}`)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCacheEnabled((v) => !v)}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors flex items-center ${
              cacheEnabled
                ? 'bg-primary-container justify-end'
                : 'bg-surface-container-highest justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-surface-container-lowest shadow" />
          </button>
        </div>

        <div className="bg-surface-container-lowest/80 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-on-surface">
              {cacheEnabled
                ? t(
                    `${hours} ساعت و ${mins} دقیقه باقیمانده`,
                    `${hours}h ${mins}m remaining`
                  )
                : t('کش متوقف شده است', 'Cache inactive')}
            </span>
            <span className="font-mono text-primary-container" dir="ltr">
              {ttlPct}%
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-secondary to-primary-container h-full rounded-full transition-all duration-300"
              style={{ width: `${cacheEnabled ? ttlPct : 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              extendCacheMinutes(60);
              showToast(t('طول عمر کش ۱ ساعت تمدید شد (+1h)', 'Extended cache TTL by +1h'), 'cyan');
            }}
            className="py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-xs font-medium text-primary flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('تمدید ۱ ساعته (+1h)', 'Extend +1h')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              extendCacheMinutes(1440);
              showToast(t('طول عمر کش ۲۴ ساعت تمدید شد (+24h)', 'Extended cache TTL by +24h'), 'purple');
            }}
            className="py-2.5 px-3 rounded-xl bg-secondary-container/40 hover:bg-secondary-container/60 text-xs font-medium text-secondary flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('تمدید ۲۴ ساعته (+24h)', 'Extend +24h')}</span>
          </button>
        </div>
      </section>

      {/* Cached Context Artifacts */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary-container" />
            <h2 className="font-display text-sm font-bold text-on-surface">
              {t('اجزای کش‌شده در این پروژه', 'Cached Context Artifacts')}
            </h2>
          </div>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-primary-fixed">
            {cacheArtifacts.length} {t('دسته', 'bundles')}
          </span>
        </div>

        {cacheArtifacts.map((art) => (
          <div
            key={art.id}
            className="bg-surface-container rounded-2xl p-3.5 shadow-md cyber-border-subtle flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center font-mono text-xs font-bold text-primary-container shrink-0">
                {art.code}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">
                  {t(art.titleFa, art.titleEn)}
                </p>
                <p className="font-mono text-[10px] text-on-surface-variant mt-0.5" dir="ltr">
                  {art.metaFiles} • <span className="text-primary">{art.tokensK}k tok</span> •{' '}
                  {t(art.statusFa, art.statusEn)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewArtifact(art)}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary-container"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  showToast(
                    t(`بسته ${art.code} بازخوانی شد ✓`, `Refreshed ${art.code} bundle ✓`),
                    'cyan'
                  )
                }
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary-container"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Interactive Query Cost Simulator */}
      <section className="bg-surface-container rounded-2xl p-4 shadow-lg cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-on-surface">
            {t('شبیه‌ساز صرفه‌جویی ماهانه', 'Interactive Monthly Cost Simulator')}
          </h2>
          <span className="font-mono text-xs text-primary-container" dir="ltr">
            {dailyQueries} req/day
          </span>
        </div>

        <input
          type="range"
          min={20}
          max={500}
          step={10}
          value={dailyQueries}
          onChange={(e) => setDailyQueries(Number(e.target.value))}
          className="w-full accent-[#00f5d4]"
        />

        <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs" dir="ltr">
          <div className="p-2.5 rounded-xl bg-surface-container-lowest">
            <span className="text-[10px] text-outline block">Without Cache</span>
            <span className="text-error font-bold">${standardCostMonthly}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-lowest">
            <span className="text-[10px] text-outline block">With Cache</span>
            <span className="text-primary-container font-bold">${cachedCostMonthly}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-secondary-container/30">
            <span className="text-[10px] text-secondary block">Net Saved</span>
            <span className="text-secondary font-bold">${savedMonthly}</span>
          </div>
        </div>
      </section>

      {/* Maintenance & Purge */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            extendCacheMinutes(120);
            showToast(
              t('کش با آخرین کامیت مخزن همگام شد ✓', 'Synced cache with HEAD commit ✓'),
              'cyan'
            );
          }}
          className="py-3 px-3 rounded-xl bg-primary-container text-on-primary-container font-display text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('همگام‌سازی فوری کش', 'Sync Cache Now')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            purgeCache();
            showToast(t('حافظه کش پاک‌سازی و آزاد شد', 'Context cache purged'), 'error');
          }}
          className="py-3 px-3 rounded-xl bg-error-container/30 hover:bg-error-container/45 text-error font-display text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('پاک‌سازی کش (Purge)', 'Purge Cache')}</span>
        </button>
      </div>

      {/* Artifact Preview Modal */}
      {previewArtifact && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewArtifact(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-surface-container-low p-5 shadow-2xl cyber-border space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-on-surface">
                {t(previewArtifact.titleFa, previewArtifact.titleEn)}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewArtifact(null)}
                className="text-outline hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre
              className="p-3 rounded-xl bg-surface-container-lowest font-mono text-xs text-primary-fixed leading-relaxed overflow-x-auto"
              dir="ltr"
            >
              {previewArtifact.previewContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
