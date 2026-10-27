import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { readClipboardText } from '../services/nativeBridge';
import type { GeminiModelId } from '../types/app';

export const GeminiKeyModal: React.FC = () => {
  const {
    isKeyModalOpen,
    setKeyModalOpen,
    settings,
    geminiConnection,
    activateGeminiKey,
    disconnectGeminiKey,
    showToast,
    t,
  } = useApp();

  const [draftKey, setDraftKey] = useState(settings.geminiApiKey);
  const [draftModel, setDraftModel] = useState<GeminiModelId>(settings.geminiModel);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isKeyModalOpen) {
      setDraftKey(settings.geminiApiKey);
      setDraftModel(settings.geminiModel);
    }
  }, [isKeyModalOpen, settings.geminiApiKey, settings.geminiModel]);

  if (!isKeyModalOpen) return null;

  const isVerifying = geminiConnection.status === 'verifying';

  const handlePaste = async () => {
    const clip = await readClipboardText();
    if (clip.trim()) {
      setDraftKey(clip.trim());
      showToast(t('کلید از کلیپ‌بورد جای‌گذاری شد ✓', 'Pasted API key from clipboard ✓'), 'cyan');
    } else {
      showToast(
        t('متنی در کلیپ‌بورد یافت نشد — کلید را دستی وارد کنید', 'Clipboard empty — type or paste manually'),
        'purple'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await activateGeminiKey(draftKey, draftModel);
    if (ok) {
      setKeyModalOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setKeyModalOpen(false)}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-container-low p-5 shadow-2xl cyber-border space-y-4 pb-safe"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                {t('فعال‌سازی مستقیم Google Gemini API', 'Activate Live Google Gemini API')}
              </h2>
              <p className="text-[11px] font-mono text-on-surface-variant">
                {t(
                  'اتصال مستقیم به سرور گوگل و ذخیره امن در دستگاه',
                  'Direct official v1beta API • Stored locally on device'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setKeyModalOpen(false)}
            className="w-8 h-8 rounded-xl bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        {geminiConnection.status === 'connected' && (
          <div className="p-3 rounded-xl bg-primary-container/12 cyber-border flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="w-4 h-4 text-primary-container shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-primary-container">
                {t(
                  `متصل و فعال • مدل: ${geminiConnection.resolvedModel} (${geminiConnection.latencyMs}ms)`,
                  `Connected & Active • ${geminiConnection.resolvedModel} (${geminiConnection.latencyMs}ms)`
                )}
              </p>
              {geminiConnection.sampleReply && (
                <p className="font-mono text-[11px] text-on-surface-variant" dir="ltr">
                  Handshake: "{geminiConnection.sampleReply}"
                </p>
              )}
            </div>
          </div>
        )}

        {geminiConnection.status === 'error' && geminiConnection.error && (
          <div className="p-3 rounded-xl bg-error-container/30 border border-error/30 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-error">
                {t('خطای احراز هویت کلید از سمت گوگل:', 'Google API Verification Error:')}
              </p>
              <p className="font-mono text-[11px] text-on-error-container mt-0.5" dir="ltr">
                {geminiConnection.error}
              </p>
            </div>
          </div>
        )}

        {/* API Key Input + Paste / Show / Clear */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-on-surface">
              {t('کلید API جمینای (Google AI Studio Key):', 'Google AI Studio API Key:')}
            </label>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-primary-container hover:underline inline-flex items-center gap-1"
            >
              <span>{t('دریافت کلید رایگان', 'Get Free API Key')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-1.5" dir="ltr">
            <div className="relative flex-1 flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="Paste your Gemini API Key here..."
                className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs px-3 py-3 pr-9 rounded-xl outline-none cyber-border focus:border-primary-container"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 text-outline hover:text-on-surface"
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handlePaste}
              className="h-[42px] px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary-container text-xs font-medium flex items-center gap-1.5 shrink-0 active:scale-95"
              title={t('چسباندن از کلیپ‌بورد', 'Paste from Clipboard')}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>{t('چسباندن', 'Paste')}</span>
            </button>
          </div>
        </div>

        {/* Model Selector populated dynamically */}
        <div className="space-y-1.5">
          <label className="block text-xs text-on-surface-variant">
            {t('انتخاب مدل پردازشی گوگل:', 'Select Gemini Model:')}
          </label>
          <select
            value={draftModel}
            onChange={(e) => setDraftModel(e.target.value)}
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

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {settings.geminiApiKey.trim() && (
            <button
              type="button"
              onClick={() => {
                disconnectGeminiKey();
                setDraftKey('');
              }}
              className="h-11 px-3 rounded-xl bg-error-container/30 text-error text-xs font-semibold flex items-center gap-1.5 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('حذف کلید', 'Remove')}</span>
            </button>
          )}

          <button
            type="submit"
            disabled={!draftKey.trim() || isVerifying}
            className="flex-1 h-11 px-4 rounded-xl bg-primary-container disabled:opacity-45 text-on-primary-container font-display text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,245,212,0.35)] active:scale-98 transition-all"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {t('در حال تایید کلید با سرور گوگل...', 'Verifying with Google AI...')}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {t('ذخیره، فعال‌سازی و اتصال زنده', 'Save, Verify & Activate Live API')}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
