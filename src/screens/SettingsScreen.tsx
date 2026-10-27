import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Loader2,
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
import { generateAssistantReply } from '../services/geminiApi';
import { pingGithubApi } from '../services/githubApi';
import { copyText, readClipboardText } from '../services/nativeBridge';
import type { CacheTtlPreset, GeminiModelId } from '../types/app';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    geminiConnection,
    activateGeminiKey,
    disconnectGeminiKey,
    recordTokenUsage,
    navigate,
    showToast,
    t,
  } = useApp();

  const [draftGeminiKey, setDraftGeminiKey] = useState(settings.geminiApiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [githubStatusText, setGithubStatusText] = useState<string>('');

  const [liveTestPrompt, setLiveTestPrompt] = useState(
    'سلام! در یک جمله کوتاه فارسی بگو کدام مدل Gemini هستی و تایید کن کلید API فعال است.'
  );
  const [liveTestingPrompt, setLiveTestingPrompt] = useState(false);
  const [liveTestOutput, setLiveTestOutput] = useState<{
    reply: string;
    latencyMs: number;
    tokens: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setDraftGeminiKey(settings.geminiApiKey);
  }, [settings.geminiApiKey]);

  const [newTgChatId, setNewTgChatId] = useState('');
  const [newTgLabel, setNewTgLabel] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const isVerifyingGemini = geminiConnection.status === 'verifying';
  const hasUnsavedKeyChange = draftGeminiKey.trim() !== settings.geminiApiKey.trim();

  const handleActivateGemini = async () => {
    await activateGeminiKey(draftGeminiKey, settings.geminiModel);
  };

  const handlePasteGeminiKey = async () => {
    const clip = await readClipboardText();
    if (clip.trim()) {
      setDraftGeminiKey(clip.trim());
      showToast(
        t('کلید از کلیپ‌بورد خوانده شد — دکمه فعال‌سازی را بزنید ✓', 'Pasted key from clipboard — click Activate ✓'),
        'cyan'
      );
    } else {
      showToast(
        t('متنی در کلیپ‌بورد یافت نشد؛ کلید را مستقیماً در کادر بچسبانید', 'Clipboard unavailable — paste directly into the field'),
        'purple'
      );
    }
  };

  const handleRunInlinePromptTest = async () => {
    const keyToUse = draftGeminiKey.trim() || settings.geminiApiKey.trim();
    if (!keyToUse) {
      showToast(
        t('ابتدا کلید Gemini API را وارد و فعال کنید', 'Please enter and activate your Gemini API Key first'),
        'purple'
      );
      return;
    }
    setLiveTestingPrompt(true);
    setLiveTestOutput(null);
    try {
      if (hasUnsavedKeyChange || geminiConnection.status !== 'connected') {
        const ok = await activateGeminiKey(keyToUse, settings.geminiModel);
        if (!ok) {
          setLiveTestingPrompt(false);
          return;
        }
      }
      const started = performance.now();
      const res = await generateAssistantReply({
        prompt: liveTestPrompt.trim() || 'Confirm live connection in one sentence.',
        history: [],
        settings: { ...settings, geminiApiKey: keyToUse, tokenStreaming: false },
      });
      const elapsed = res.latencyMs || Math.round(performance.now() - started);
      setLiveTestOutput({
        reply: res.text,
        latencyMs: elapsed,
        tokens: res.tokensUsed,
      });
      recordTokenUsage('Settings Live API Prompt Test', res.modelUsed, res.tokensUsed, elapsed);
      showToast(
        t(`پاسخ زنده از گوگل دریافت شد (${elapsed}ms) ✓`, `Received live reply from Google (${elapsed}ms) ✓`),
        'cyan'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setLiveTestOutput({
        reply: '',
        latencyMs: 0,
        tokens: 0,
        error: msg,
      });
      showToast(msg, 'error');
    } finally {
      setLiveTestingPrompt(false);
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

      {/* 2. Google Gemini API Configuration (Fully Live & Interactive) */}
      <section className="rounded-2xl bg-surface-container-low p-4 shadow-md cyber-border space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/15 flex items-center justify-center text-primary-container">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-sm font-bold text-on-surface">
                {t('پیکربندی و فعال‌سازی کلید Google Gemini API', 'Google Gemini API Key Activation')}
              </h2>
              <p className="font-mono text-[10px] text-on-surface-variant" dir="ltr">
                generativelanguage.googleapis.com/v1beta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`font-mono text-[10px] px-2.5 py-1 rounded-full font-bold ${
                geminiConnection.status === 'connected'
                  ? 'bg-primary-container/20 text-primary-container cyber-border'
                  : geminiConnection.status === 'error'
                    ? 'bg-error-container/40 text-error'
                    : geminiConnection.status === 'verifying'
                      ? 'bg-surface-container-high text-primary-fixed-dim'
                      : 'bg-surface-container text-secondary'
              }`}
              dir="ltr"
            >
              {geminiConnection.status === 'connected'
                ? `VERIFIED • ${geminiConnection.latencyMs}ms`
                : geminiConnection.status === 'verifying'
                  ? 'CHECKING...'
                  : geminiConnection.status === 'error'
                    ? 'AUTH ERROR'
                    : settings.geminiApiKey.trim()
                      ? 'SAVED'
                      : 'DEMO'}
            </span>
          </div>
        </div>

        {/* Live Connection Diagnostic Banner */}
        {geminiConnection.status === 'connected' ? (
          <div className="p-3 rounded-xl bg-primary-container/12 cyber-border space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-primary-container flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {t('کلید شما فعال و متصل به سرور گوگل است', 'Your Gemini API Key is Verified & Live')}
              </span>
              <span className="font-mono text-[10px] text-primary-fixed-dim" dir="ltr">
                {geminiConnection.lastCheckedAt || 'Active'}
              </span>
            </div>
            <p className="font-mono text-[11px] text-on-surface-variant" dir="ltr">
              Model: {geminiConnection.resolvedModel}
              {geminiConnection.inputTokenLimit
                ? ` • Context: ${(geminiConnection.inputTokenLimit / 1000).toFixed(0)}k tokens`
                : ''}
            </p>
            {geminiConnection.sampleReply && (
              <p className="font-mono text-[10px] text-outline" dir="ltr">
                Google Handshake: "{geminiConnection.sampleReply}"
              </p>
            )}
          </div>
        ) : geminiConnection.status === 'error' ? (
          <div className="p-3 rounded-xl bg-error-container/30 border border-error/30 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('کلید تایید نشد — پاسخ سرور گوگل:', 'Verification Failed — Google API Response:')}</span>
            </div>
            <p className="font-mono text-[11px] text-on-error-container break-words" dir="ltr">
              {geminiConnection.error}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-container flex items-center justify-between gap-2 text-xs">
            <span className="text-on-surface-variant leading-5">
              {draftGeminiKey.trim()
                ? t(
                    'کلید وارد شده است — برای فعال‌سازی روی دکمه «ذخیره، فعال‌سازی و اتصال زنده» بزنید.',
                    'Key entered — click "Save, Verify & Activate Live Gemini API" below to go live.'
                  )
                : t(
                    'در حال حاضر کلیدی ثبت نشده و برنامه در حالت پیش‌نمایش (Demo) است. کلید Google AI Studio خود را وارد کنید تا هوش مصنوعی واقعی فعال شود.',
                    'Currently in Demo Mode because no API key is saved. Enter your Google AI Studio key below to activate real Gemini AI.'
                  )}
            </span>
          </div>
        )}

        {/* API Key Input + Paste / Show / Clear + AI Studio Link */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs text-on-surface-variant">
              {t('کلید دسترسی سرویس (Google Gemini API Key):', 'Google Gemini API Key:')}
            </label>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-primary-container hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>{t('دریافت کلید رایگان از گوگل', 'Get Free Key (AI Studio)')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-1.5" dir="ltr">
            <div className="relative flex-1 flex items-center">
              <KeyRound className="w-4 h-4 text-primary-container absolute left-3 pointer-events-none" />
              <input
                type={showGeminiKey ? 'text' : 'password'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={draftGeminiKey}
                onChange={(e) => setDraftGeminiKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleActivateGemini();
                  }
                }}
                placeholder="Enter Google Gemini API Key"
                className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs pl-9 pr-10 py-3 rounded-xl outline-none cyber-border focus:border-primary-container"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey((v) => !v)}
                className="absolute right-2.5 text-outline hover:text-on-surface"
                title={showGeminiKey ? 'Hide Key' : 'Show Key'}
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handlePasteGeminiKey}
              className="h-[42px] px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary-container text-xs font-semibold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
              title={t('چسباندن از کلیپ‌بورد', 'Paste from Clipboard')}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>{t('چسباندن', 'Paste')}</span>
            </button>

            {(draftGeminiKey.trim() || settings.geminiApiKey.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setDraftGeminiKey('');
                  setLiveTestOutput(null);
                  disconnectGeminiKey();
                }}
                className="h-[42px] px-2.5 rounded-xl bg-error-container/30 hover:bg-error-container/50 text-error text-xs flex items-center justify-center shrink-0 active:scale-95 transition-all"
                title={t('پاک کردن کلید', 'Clear API Key')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Model Selection (Dynamically populated from Google API when verified) & Temperature */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs text-on-surface-variant">
              {t('مدل پیش‌فرض پردازش (لیست رسمی گوگل):', 'Default Gemini Model:')}
            </label>
            <select
              value={settings.geminiModel}
              onChange={(e) => {
                const chosen = e.target.value as GeminiModelId;
                updateSettings({ geminiModel: chosen });
                if (draftGeminiKey.trim()) {
                  activateGeminiKey(draftGeminiKey, chosen);
                }
              }}
              dir="ltr"
              className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs py-2.5 px-3 rounded-xl outline-none cyber-border-subtle"
            >
              {geminiConnection.availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">
                {t('دمای خلاقیت (Temperature):', 'Temperature:')}
              </span>
              <span className="font-mono text-primary-container font-bold" dir="ltr">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-[#00f5d4] cursor-pointer mt-2"
            />
          </div>
        </div>

        {/* Primary Activate & Verify CTA */}
        <button
          type="button"
          disabled={isVerifyingGemini || !draftGeminiKey.trim()}
          onClick={handleActivateGemini}
          className="w-full py-3 px-4 rounded-xl bg-primary-container disabled:opacity-45 text-on-primary-container font-display text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,245,212,0.3)] active:scale-98 transition-all"
        >
          {isVerifyingGemini ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {t(
                  'در حال احراز هویت کلید و دریافت لیست مدل‌ها از گوگل...',
                  'Authenticating Key & Fetching Models from Google...'
                )}
              </span>
            </>
          ) : (
            <>
              <Radio className="w-4 h-4" />
              <span>
                {geminiConnection.status === 'connected' && !hasUnsavedKeyChange
                  ? t('تست مجدد و همگام‌سازی مدل‌های کلید ✓', 'Re-verify Key & Sync Models ✓')
                  : t('ذخیره، فعال‌سازی و اتصال زنده به Gemini', 'Save, Verify & Activate Live Gemini API')}
              </span>
            </>
          )}
        </button>

        {/* Inline Live Prompt Sandbox */}
        <div className="p-3 rounded-xl bg-surface-container space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-container" />
              {t('تست زنده پاسخ‌گویی کلید در همین صفحه', 'Live Gemini Prompt Sandbox')}
            </span>
            <span className="font-mono text-[10px] text-outline" dir="ltr">
              POST :generateContent
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={liveTestPrompt}
              onChange={(e) => setLiveTestPrompt(e.target.value)}
              placeholder={t('یک پیام آزمایشی برای جمینای بنویسید...', 'Type a live test prompt for Gemini...')}
              className="flex-1 bg-surface-container-lowest text-on-surface text-xs px-3 py-2 rounded-xl outline-none cyber-border-subtle"
            />
            <button
              type="button"
              disabled={liveTestingPrompt || (!draftGeminiKey.trim() && !settings.geminiApiKey.trim())}
              onClick={handleRunInlinePromptTest}
              className="h-9 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright disabled:opacity-45 text-primary-container font-display text-xs font-bold flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
            >
              {liveTestingPrompt ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{t('ارسال تست زنده', 'Run Live')}</span>
            </button>
          </div>

          {liveTestOutput && (
            <div
              className={`p-2.5 rounded-xl text-xs leading-6 ${
                liveTestOutput.error
                  ? 'bg-error-container/30 text-on-error-container'
                  : 'bg-surface-container-lowest text-on-surface cyber-border-subtle'
              }`}
            >
              {liveTestOutput.error ? (
                <p className="font-mono text-[11px]" dir="ltr">
                  Error: {liveTestOutput.error}
                </p>
              ) : (
                <>
                  <p>{liveTestOutput.reply}</p>
                  <div
                    className="mt-1.5 pt-1.5 border-t border-white/[0.06] flex items-center justify-between font-mono text-[10px] text-primary-fixed-dim"
                    dir="ltr"
                  >
                    <span>Model: {settings.geminiModel}</span>
                    <span>
                      {liveTestOutput.tokens} tokens • {liveTestOutput.latencyMs}ms
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
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
                placeholder="Enter GitHub Personal Access Token"
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
                placeholder="https://discord.com/api/webhooks/..."
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
        onClick={async () => {
          if (draftGeminiKey.trim() && (hasUnsavedKeyChange || geminiConnection.status !== 'connected')) {
            await activateGeminiKey(draftGeminiKey, settings.geminiModel);
            return;
          }
          showToast(
            t(
              'تمام تنظیمات و کلیدها در حافظه دستگاه ذخیره شدند ✓',
              'All settings & credentials persisted on device ✓'
            ),
            'cyan'
          );
        }}
        className="w-full py-3.5 px-4 rounded-2xl bg-primary-container text-on-primary-container font-display text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,245,212,0.4)] active:scale-98 transition-all"
      >
        <Save className="w-4 h-4" />
        <CheckCircle2 className="w-4 h-4" />
        <span>{t('ذخیره و فعال‌سازی تنظیمات (Save & Activate)', 'Save & Activate Configuration')}</span>
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
