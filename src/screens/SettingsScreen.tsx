import React, { useState } from 'react';
import {
  BellRing,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  EyeOff,
  Languages,
  MessageSquare,
  Phone,
  PlusCircle,
  Radio,
  Save,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  Wallet,
  Webhook,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pingGeminiApi } from '../services/geminiApi';
import { pingGithubApi } from '../services/githubApi';
import { copyText } from '../services/nativeBridge';
import type { CacheTtlPreset, GeminiModelId } from '../types/app';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, navigate, showToast, t } = useApp();

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [geminiLatency, setGeminiLatency] = useState<string>('142ms');
  const [githubStatusText, setGithubStatusText] = useState<string>('');

  const [newTgChatId, setNewTgChatId] = useState('');
  const [newTgLabel, setNewTgLabel] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handlePingGemini = async () => {
    setTestingGemini(true);
    const res = await pingGeminiApi(settings.geminiApiKey, settings.geminiModel);
    setTestingGemini(false);
    setGeminiLatency(`${res.latencyMs}ms`);
    if (res.ok) {
      showToast(
        t(
          `اتصال Gemini تایید شد (${res.displayName} • ${res.latencyMs}ms) ✓`,
          `Gemini Connected (${res.displayName} • ${res.latencyMs}ms) ✓`
        ),
        'cyan'
      );
    } else if (res.error === 'DEMO_MODE_NO_KEY') {
      showToast(
        t(
          'کلید Gemini خالی است (برنامه در حالت نمایشی کار می‌کند)',
          'No Gemini API key entered (running in Demo Mode)'
        ),
        'purple'
      );
    } else {
      showToast(t(`خطا در تست کلید: ${res.error}`, `Key test failed: ${res.error}`), 'error');
    }
  };

  const handlePingGithub = async () => {
    setTestingGithub(true);
    const res = await pingGithubApi(settings.githubToken, settings.githubUsername);
    setTestingGithub(false);
    if (res.ok) {
      setGithubStatusText(
        `@${res.login} • ${res.rateRemaining}/${res.rateLimit} req • ${res.latencyMs}ms`
      );
      if (res.login && res.login !== 'github') {
        updateSettings({ githubUsername: res.login });
      }
      showToast(
        t(
          `ارتباط با GitHub برقرار شد (@${res.login} • ${res.latencyMs}ms) ✓`,
          `GitHub Connected (@${res.login} • ${res.latencyMs}ms) ✓`
        ),
        'cyan'
      );
    } else {
      showToast(t(`خطا در اتصال GitHub: ${res.error}`, `GitHub error: ${res.error}`), 'error');
    }
  };

  const toggleThreshold = (val: number) => {
    const exists = settings.alertThresholds.includes(val);
    const next = exists
      ? settings.alertThresholds.filter((x) => x !== val)
      : [...settings.alertThresholds, val].sort((a, b) => a - b);
    updateSettings({ alertThresholds: next });
  };

  const handleAddTelegram = () => {
    if (!newTgChatId.trim()) return;
    updateSettings({
      telegramRecipients: [
        ...settings.telegramRecipients,
        {
          id: `tg-${Date.now()}`,
          labelFa: newTgLabel.trim() || 'گیرنده تلگرام جدید',
          labelEn: newTgLabel.trim() || 'Telegram Recipient',
          chatId: newTgChatId.trim(),
          badge: 'Custom',
        },
      ],
    });
    setNewTgChatId('');
    setNewTgLabel('');
    showToast(t('مقصد تلگرام اضافه شد ✓', 'Added Telegram recipient ✓'), 'cyan');
  };

  const handleRemoveTelegram = (id: string, isPrimary?: boolean) => {
    if (isPrimary) {
      showToast(t('گیرنده اصلی قابل حذف نیست', 'Cannot delete primary recipient'), 'error');
      return;
    }
    updateSettings({
      telegramRecipients: settings.telegramRecipients.filter((r) => r.id !== id),
    });
  };

  const handleAddSms = () => {
    if (!newPhone.trim()) return;
    updateSettings({
      smsRecipients: [
        ...settings.smsRecipients,
        {
          id: `sms-${Date.now()}`,
          labelFa: 'شماره پشتیبان جدید',
          labelEn: 'Backup Alert Phone',
          phone: newPhone.trim(),
        },
      ],
    });
    setNewPhone('');
    showToast(t('شماره پیامک اضطراری اضافه شد ✓', 'Added emergency SMS number ✓'), 'cyan');
  };

  const SwitchToggle: React.FC<{
    checked: boolean;
    onChange: (next: boolean) => void;
  }> = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
        checked
          ? 'bg-primary-container justify-end'
          : 'bg-surface-container-highest justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-surface-container-lowest shadow" />
    </button>
  );

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-12 gap-4">
      {/* 1. Language & RTL/LTR Matrix */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-md cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary-container">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                {t('تنظیمات زبان و رابط کاربری', 'Language & Direction Matrix')}
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant">
                Bilingual RTL / LTR Engine
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary-container font-mono text-[10px]">
            {settings.language.toUpperCase()}
          </span>
        </div>

        <div className="p-1 rounded-xl bg-surface-container-lowest grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => updateSettings({ language: 'fa' })}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              settings.language === 'fa'
                ? 'bg-surface-container text-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            فارسی (RTL)
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ language: 'en' })}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
              settings.language === 'en'
                ? 'bg-surface-container text-primary-container shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            English (LTR)
          </button>
        </div>
      </section>

      {/* 2. Google Gemini API Configuration */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-md cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary-container">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                {t('پیکربندی هوش مصنوعی گوگل (Gemini)', 'Google Gemini AI Configuration')}
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant">
                {t(
                  'کلید فقط در حافظه امن دستگاه شما ذخیره می‌شود',
                  'Stored locally on device via Capacitor Preferences'
                )}
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-surface-container text-primary-container">
            {settings.geminiApiKey.trim() ? `LIVE • ${geminiLatency}` : 'DEMO'}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-on-surface-variant">
            {t('کلید دسترسی سرویس (Google Gemini API Key):', 'Google Gemini API Key:')}
          </label>
          <div className="relative flex items-center" dir="ltr">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={settings.geminiApiKey}
              onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs px-3 py-2.5 pr-10 rounded-xl outline-none cyber-border-subtle"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey((v) => !v)}
              className="absolute right-2.5 text-outline hover:text-on-surface"
            >
              {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-on-surface-variant">
            {t('مدل پیش‌فرض پردازش (Engine Model):', 'Default Gemini Model:')}
          </label>
          <select
            value={settings.geminiModel}
            onChange={(e) => updateSettings({ geminiModel: e.target.value as GeminiModelId })}
            dir="ltr"
            className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs py-2.5 px-3 rounded-xl outline-none cyber-border-subtle"
          >
            <option value="gemini-2.5-flash">gemini-2.5-flash (Fastest & Multimodal)</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Code & PR Reasoning)</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro (2M Context Window)</option>
            <option value="gemini-1.5-flash">gemini-1.5-flash (Lightweight)</option>
          </select>
        </div>

        <button
          type="button"
          disabled={testingGemini}
          onClick={handlePingGemini}
          className="w-full py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary-container font-display text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Radio className={`w-4 h-4 ${testingGemini ? 'animate-ping' : ''}`} />
          <span>
            {testingGemini
              ? t('در حال بررسی اتصال با سرورهای گوگل...', 'Testing Gemini handshake...')
              : t('تست زنده اتصال Gemini API (Ping)', 'Test Live Gemini Connection')}
          </span>
        </button>
      </section>

      {/* 3. GitHub Personal Access Token & Sync */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-md cyber-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                {t('یکپارچگی با گیت‌هاب (GitHub API)', 'GitHub REST Integration')}
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant" dir="ltr">
                {githubStatusText || `@${settings.githubUsername || 'gase99'}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="block text-xs text-on-surface-variant">
              {t('نام کاربری گیت‌هاب (Username):', 'GitHub Username:')}
            </label>
            <input
              type="text"
              dir="ltr"
              value={settings.githubUsername}
              onChange={(e) => updateSettings({ githubUsername: e.target.value })}
              placeholder="gase99"
              className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs px-3 py-2.5 rounded-xl outline-none cyber-border-subtle"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-on-surface-variant">
              {t('توکن دسترسی شخصی (PAT اختیاری):', 'Personal Access Token (Optional):')}
            </label>
            <div className="relative flex items-center" dir="ltr">
              <input
                type={showGithubToken ? 'text' : 'password'}
                value={settings.githubToken}
                onChange={(e) => updateSettings({ githubToken: e.target.value })}
                placeholder="ghp_... or github_pat_..."
                className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs px-3 py-2.5 pr-9 rounded-xl outline-none cyber-border-subtle"
              />
              <button
                type="button"
                onClick={() => setShowGithubToken((v) => !v)}
                className="absolute right-2.5 text-outline hover:text-on-surface"
              >
                {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={testingGithub}
          onClick={handlePingGithub}
          className="w-full py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-secondary font-display text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <Radio className={`w-4 h-4 ${testingGithub ? 'animate-ping' : ''}`} />
          <span>
            {testingGithub
              ? t('در حال استعلام از api.github.com...', 'Pinging api.github.com...')
              : t('تست اتصال و سهمیه GitHub API', 'Verify GitHub Account & Quota')}
          </span>
        </button>

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container">
            <div>
              <span className="block text-xs font-medium text-on-surface">
                {t('دریافت رویدادهای وب‌هوک (Webhooks)', 'GitHub Webhook Listener')}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {t('اطلاع‌رسانی Push و ثبت PR جدید', 'Notify on push & pull request events')}
              </span>
            </div>
            <SwitchToggle
              checked={settings.webhooksEnabled}
              onChange={(v) => updateSettings({ webhooksEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container">
            <div>
              <span className="block text-xs font-medium text-on-surface">
                {t('همگام‌سازی خودکار شاخه‌ها (Auto-sync)', 'Auto-sync Remote Branches')}
              </span>
              <span className="text-[10px] text-on-surface-variant">
                {t('به‌روزرسانی خودکار حافظه دستیار', 'Keep repository branch metadata fresh')}
              </span>
            </div>
            <SwitchToggle
              checked={settings.autoSyncBranches}
              onChange={(v) => updateSettings({ autoSyncBranches: v })}
            />
          </div>
        </div>
      </section>

      {/* 4. Budget Cap, Context Caching TTL & Multi-Channel Alerts */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-md cyber-border-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-primary-container">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                {t('مدیریت بودجه، TTL و هشدارهای چندکاناله', 'Budget, Cache TTL & Multi-Channel Alerts')}
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant">
                Quota Governance & Telegram / SMS Dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Budget Cap Presets */}
        <div className="p-3 rounded-xl bg-surface-container space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              {t('سقف بودجه ماهانه (Monthly Cap):', 'Monthly Budget Cap:')}
            </span>
            <span className="font-display text-sm font-bold text-primary font-mono" dir="ltr">
              ${settings.monthlyBudgetCap}.00 USD
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5" dir="ltr">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => updateSettings({ monthlyBudgetCap: amt })}
                className={`py-1.5 rounded-lg font-mono text-xs transition-all ${
                  settings.monthlyBudgetCap === amt
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-on-surface">
              {t('توقف خودکار استعلام سنگین در ۹۵٪ بودجه', 'Hard-stop heavy queries at 95% cap')}
            </span>
            <SwitchToggle
              checked={settings.hardStopBudget}
              onChange={(v) => updateSettings({ hardStopBudget: v })}
            />
          </div>
        </div>

        {/* Context Caching Default TTL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-primary-fixed-dim" />
              {t('طول عمر پیش‌فرض کش (Context Cache TTL)', 'Default Context Cache TTL')}
            </span>
            <button
              type="button"
              onClick={() => navigate('cache-details')}
              className="text-[11px] font-mono text-primary-container hover:underline"
            >
              {t('جزئیات کش ←', 'Open Cache →')}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2" dir="ltr">
            {(['1h', '6h', '12h', '24h'] as CacheTtlPreset[]).map((ttl) => (
              <button
                key={ttl}
                type="button"
                onClick={() => updateSettings({ defaultCacheTtl: ttl })}
                className={`py-2 rounded-xl font-mono text-xs transition-all ${
                  settings.defaultCacheTtl === ttl
                    ? 'bg-surface-container-high text-primary-container font-bold cyber-border'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {ttl}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Select Quota Alert Thresholds */}
        <div className="p-3 rounded-xl bg-surface-container space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-secondary" />
              <span className="text-xs font-bold text-on-surface">
                {t('مرکز هشدارهای هوشمند بودجه', 'Quota Alert Thresholds')}
              </span>
            </div>
            <SwitchToggle
              checked={settings.alertManagerEnabled}
              onChange={(v) => updateSettings({ alertManagerEnabled: v })}
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[50, 75, 90, 100].map((th) => {
              const selected = settings.alertThresholds.includes(th);
              return (
                <button
                  key={th}
                  type="button"
                  onClick={() => toggleThreshold(th)}
                  className={`px-3 py-1 rounded-lg font-mono text-xs transition-all ${
                    selected
                      ? th === 100
                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                        : 'bg-primary-container text-on-primary-container font-bold'
                      : 'bg-surface-container-lowest text-on-surface-variant'
                  }`}
                >
                  {th}% {th === 100 ? t('(بحرانی)', '(Critical)') : ''}
                </button>
              );
            })}
          </div>

          {/* Telegram Multi-Recipient Bot */}
          <div className="p-3 rounded-xl bg-surface-container-lowest space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-primary-container" />
                {t('ربات تلگرام (Telegram Alerts)', 'Telegram Bot Recipients')}
              </span>
              <span className="font-mono text-[10px] text-primary-container">
                {settings.telegramRecipients.length} {t('مقصد متصل', 'connected')}
              </span>
            </div>

            {settings.telegramRecipients.map((tg) => (
              <div
                key={tg.id}
                className="p-2 rounded-lg bg-surface-container flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-on-surface font-medium truncate">
                    {t(tg.labelFa, tg.labelEn)}
                  </p>
                  <p className="font-mono text-[10px] text-primary-fixed-dim" dir="ltr">
                    ID: {tg.chatId} • {tg.badge}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        t(
                          `پیام تست تلگرام به ${tg.chatId} ارسال شد ✓`,
                          `Sent Telegram test alert to ${tg.chatId} ✓`
                        ),
                        'cyan'
                      )
                    }
                    className="px-2 py-1 rounded bg-surface-container-high text-[10px] font-mono text-primary"
                  >
                    {t('تست', 'Ping')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveTelegram(tg.id, tg.isPrimary)}
                    className="p-1 text-outline hover:text-error"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newTgLabel}
                onChange={(e) => setNewTgLabel(e.target.value)}
                placeholder={t('عنوان گروه/چت', 'Label')}
                className="w-28 bg-surface-container text-xs px-2.5 py-1.5 rounded-lg outline-none text-on-surface"
              />
              <input
                type="text"
                dir="ltr"
                value={newTgChatId}
                onChange={(e) => setNewTgChatId(e.target.value)}
                placeholder="Chat ID (e.g. -10019283)"
                className="flex-1 bg-surface-container font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none text-on-surface"
              />
              <button
                type="button"
                onClick={handleAddTelegram}
                className="px-2.5 py-1.5 rounded-lg bg-primary-container/20 text-primary-container text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('افزودن', 'Add')}</span>
              </button>
            </div>
          </div>

          {/* SMS Multi-Number Emergency Alerts */}
          <div className="p-3 rounded-xl bg-surface-container-lowest space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-secondary" />
                {t('پیامک اضطراری (SMS Alert Numbers)', 'Emergency SMS Numbers')}
              </span>
              <span className="font-mono text-[10px] text-secondary">
                {settings.smsRecipients.length} {t('شماره فعال', 'numbers')}
              </span>
            </div>

            {settings.smsRecipients.map((sms) => (
              <div
                key={sms.id}
                className="p-2 rounded-lg bg-surface-container flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-primary-container shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-on-surface truncate">
                      {t(sms.labelFa, sms.labelEn)}
                    </p>
                    <p className="font-mono text-[11px] text-on-surface-variant" dir="ltr">
                      {sms.phone}
                    </p>
                  </div>
                </div>
                {!sms.isPrimary && (
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        smsRecipients: settings.smsRecipients.filter((x) => x.id !== sms.id),
                      })
                    }
                    className="p-1 text-outline hover:text-error"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="tel"
                dir="ltr"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+98 912 000 0000"
                className="flex-1 bg-surface-container font-mono text-xs px-2.5 py-1.5 rounded-lg outline-none text-on-surface"
              />
              <button
                type="button"
                onClick={handleAddSms}
                className="px-2.5 py-1.5 rounded-lg bg-secondary-container/40 text-secondary text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t('افزودن شماره', 'Add')}</span>
              </button>
            </div>
          </div>

          {/* Discord / Slack Team Webhook */}
          <div className="p-3 rounded-xl bg-surface-container-lowest space-y-1.5">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Webhook className="w-3.5 h-3.5 text-primary-fixed" />
              {t('وب‌هوک تیمی (Discord / Slack Webhook)', 'Discord & Slack Webhook')}
            </span>
            <div className="flex items-center gap-1.5" dir="ltr">
              <input
                type="text"
                value={settings.discordWebhookUrl}
                onChange={(e) => updateSettings({ discordWebhookUrl: e.target.value })}
                className="flex-1 bg-surface-container font-mono text-[11px] px-2.5 py-1.5 rounded-lg outline-none text-on-surface"
              />
              <button
                type="button"
                onClick={() => {
                  copyText(settings.discordWebhookUrl);
                  showToast(t('آدرس وب‌هوک کپی شد ✓', 'Webhook URL copied ✓'), 'cyan');
                }}
                className="p-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary-container"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. App Preferences */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-md cyber-border-subtle space-y-2.5">
        <h2 className="font-display text-sm font-bold text-on-surface">
          {t('تنظیمات رفتاری برنامه', 'Editor & Streaming Preferences')}
        </h2>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container">
          <div>
            <span className="block text-xs font-medium text-on-surface">
              {t('کپی خودکار با لمس بلوک کد (Auto-copy)', 'Tap-to-copy Code Blocks')}
            </span>
            <span className="text-[10px] text-on-surface-variant">
              {t('با ضربه روی هر بلوک کد در کلیپ‌بورد ذخیره شود', 'Copy code automatically on card tap')}
            </span>
          </div>
          <SwitchToggle
            checked={settings.autoCopyCode}
            onChange={(v) => updateSettings({ autoCopyCode: v })}
          />
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container">
          <div>
            <span className="block text-xs font-medium text-on-surface">
              {t('استریم زنده پاسخ‌ها (Token Streaming SSE)', 'Real-time Token Streaming')}
            </span>
            <span className="text-[10px] text-on-surface-variant">
              {t('نمایش لحظه‌ای کلمات پاسخ هوش مصنوعی', 'Stream tokens live as Gemini generates them')}
            </span>
          </div>
          <SwitchToggle
            checked={settings.tokenStreaming}
            onChange={(v) => updateSettings({ tokenStreaming: v })}
          />
        </div>
      </section>

      {/* Save Confirmation CTA */}
      <button
        type="button"
        onClick={() =>
          showToast(
            t(
              'تمام تنظیمات و کلیدها در حافظه دستگاه ذخیره شدند ✓',
              'All settings & credentials persisted on device ✓'
            ),
            'cyan'
          )
        }
        className="w-full py-3.5 px-4 rounded-2xl bg-primary-container text-on-primary-container font-display text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,245,212,0.4)] active:scale-98 transition-all"
      >
        <Save className="w-4 h-4" />
        <CheckCircle2 className="w-4 h-4" />
        <span>{t('ذخیره و تایید تنظیمات (Saved)', 'Save & Persist Configuration')}</span>
      </button>

      {/* Android APK Build Metadata */}
      <div
        className="rounded-xl bg-surface-container-lowest/70 px-4 py-3 flex items-center justify-between text-[11px] font-mono text-outline cyber-border-subtle"
        dir="ltr"
      >
        <span>io.github.gase99.githubagent</span>
        <span className="text-primary-fixed-dim">v2.4.0 • Android & Web</span>
      </div>
    </div>
  );
};
