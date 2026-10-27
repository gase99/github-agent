import React, { useEffect, useRef, useState } from 'react';
import {
  BrainCircuit,
  Bug,
  CheckSquare,
  Code2,
  Coins,
  FolderGit2,
  Gauge,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CodeBlockCard, parseMessageSegments } from '../components/CodeBlockCard';
import { generateAssistantReply } from '../services/geminiApi';
import { shareText } from '../services/nativeBridge';
import type { ChatMessage } from '../types/app';

export const ChatScreen: React.FC = () => {
  const {
    messages,
    setMessages,
    clearChat,
    settings,
    selectedRepo,
    navigate,
    recordTokenUsage,
    totalTokensUsed,
    showToast,
    t,
  } = useApp();

  const [input, setInput] = useState('');
  const [inputDir, setInputDir] = useState<'rtl' | 'ltr' | 'auto'>('auto');
  const [attachRepo, setAttachRepo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingText]);

  const handleInputChange = (val: string) => {
    setInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setInputDir('auto');
      return;
    }
    const isFa = /[\u0600-\u06FF\u0750-\u077F]/.test(trimmed.charAt(0));
    setInputDir(isFa ? 'rtl' : 'ltr');
  };

  const handleSend = async (overridePrompt?: string) => {
    const promptText = (overridePrompt ?? input).trim();
    if (!promptText || isGenerating) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: timeStr,
      repoContext: attachRepo ? selectedRepo.fullName : undefined,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!overridePrompt) setInput('');
    setIsGenerating(true);
    setStreamingText('');

    try {
      const repoCtx = attachRepo
        ? `${selectedRepo.fullName} (${selectedRepo.language}, branch: ${selectedRepo.defaultBranch})`
        : undefined;

      const reply = await generateAssistantReply({
        prompt: promptText,
        history: messages,
        settings,
        repoContext: repoCtx,
        onStreamChunk: (partial) => setStreamingText(partial),
      });

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply.text,
        timestamp: timeStr,
        modelBadge: reply.modelUsed,
        latencyMs: reply.latencyMs,
        tokensUsed: reply.tokensUsed,
        isLiveApi: reply.isLiveApi,
        liked: null,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      recordTokenUsage('AI Chat Inference', reply.modelUsed, reply.tokensUsed, reply.latencyMs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      showToast(
        t(`خطا در دریافت پاسخ: ${msg}`, `Inference error: ${msg}`),
        'error'
      );
    } finally {
      setIsGenerating(false);
      setStreamingText('');
    }
  };

  const toggleReaction = (msgId: string, dir: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, liked: m.liked === dir ? null : dir } : m
      )
    );
  };

  const presets = [
    {
      icon: Bug,
      color: 'text-primary-container',
      labelFa: 'بررسی باگ | Debug',
      labelEn: 'Debug Issue',
      promptFa: 'بررسی باگ و نشت حافظه در کوروتین‌های اندروید: ',
      promptEn: 'Debug lifecycle & coroutine leak in Android ViewModel: ',
    },
    {
      icon: BrainCircuit,
      color: 'text-secondary',
      labelFa: 'توضیح کد | Explain',
      labelEn: 'Explain Code',
      promptFa: `معماری و جریان داده مخزن ${selectedRepo.name} را توضیح بده`,
      promptEn: `Explain the architecture and data flow of ${selectedRepo.name}`,
    },
    {
      icon: Gauge,
      color: 'text-primary-fixed-dim',
      labelFa: 'بهینه‌سازی | Refactor',
      labelEn: 'Refactor & Cache',
      promptFa: 'بهینه‌سازی لایه شبکه با افزودن کش حافظه امن (Mutex + LRU)',
      promptEn: 'Refactor repository data source with thread-safe LRU caching',
    },
    {
      icon: CheckSquare,
      color: 'text-secondary-fixed',
      labelFa: 'ساخت تست | Unit Tests',
      labelEn: 'Unit Tests',
      promptFa: 'یک تست واحد کامل با MockK و Turbine برای سرویس استریم بنویس',
      promptEn: 'Write unit tests using MockK and Turbine for SSE stream client',
    },
  ];

  const isLiveKey = Boolean(settings.geminiApiKey.trim());

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 pt-3 pb-6 gap-3">
      {/* Telemetry & Active Model Strip */}
      <div className="bg-surface-container/90 backdrop-blur-md rounded-2xl p-3 shadow-md cyber-border-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-high text-primary-container shrink-0">
            <BrainCircuit className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container" />
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display text-sm font-bold text-on-surface truncate" dir="ltr">
                {settings.geminiModel}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold ${
                  isLiveKey
                    ? 'bg-primary-container/20 text-primary-container'
                    : 'bg-secondary-container/60 text-secondary'
                }`}
              >
                {isLiveKey ? 'LIVE API' : 'DEMO READY'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => !isLiveKey && navigate('settings')}
              className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1 text-start hover:text-primary-container transition-colors truncate"
            >
              <span>
                {isLiveKey
                  ? t('متصل به سرورهای گوگل', 'Connected to Google AI')
                  : t('کلید API تنظیم نشده (کلیک برای اتصال)', 'Tap to add live Gemini key')}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('analytics')}
            className="flex flex-col items-end px-2 py-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-1 text-primary">
              <Coins className="w-3.5 h-3.5 text-primary-fixed" />
              <span className="font-mono text-xs font-semibold" dir="ltr">
                {(totalTokensUsed / 1000).toFixed(1)}k
              </span>
            </div>
            <span className="font-mono text-[9px] text-outline" dir="ltr">
              / 2M tok
            </span>
          </button>

          <button
            type="button"
            onClick={clearChat}
            title={t('گفتگوی جدید', 'Reset Chat')}
            className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface-variant hover:text-on-surface flex items-center justify-center active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {presets.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const text = t(p.promptFa, p.promptEn);
                handleInputChange(text);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface active:scale-95 transition-all shrink-0 shadow-sm cyber-border-subtle"
            >
              <Icon className={`w-3.5 h-3.5 ${p.color}`} />
              <span className="text-xs font-medium">{t(p.labelFa, p.labelEn)}</span>
            </button>
          );
        })}
      </div>

      {/* Conversation Stream */}
      <div className="flex flex-col gap-4 py-1">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex flex-col items-end gap-1 ms-8">
                <div className="flex items-center gap-1.5 text-on-surface-variant font-mono text-[10px]">
                  <span className="font-semibold text-on-surface">{t('شما', 'You')}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.repoContext && (
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary-fixed-dim" dir="ltr">
                      @{msg.repoContext}
                    </span>
                  )}
                </div>
                <div className="bg-secondary-container text-on-secondary-container rounded-2xl rounded-ee-sm p-3.5 shadow-lg max-w-full">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" dir="auto">
                    {msg.content}
                  </p>
                  {msg.translatedHint && (
                    <div
                      className="mt-2 pt-2 border-t border-white/10 text-[11px] font-mono text-secondary-fixed/85"
                      dir="ltr"
                    >
                      {msg.translatedHint}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          const segments = parseMessageSegments(msg.content);
          return (
            <div key={msg.id} className="flex flex-col items-start gap-1.5 me-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-display text-xs font-bold text-primary" dir="ltr">
                  {msg.modelBadge || 'Gemini Assistant'}
                </span>
                {msg.latencyMs !== undefined && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-outline text-[10px] font-mono" dir="ltr">
                    {msg.latencyMs}ms
                  </span>
                )}
              </div>

              <div className="w-full bg-surface-container rounded-2xl rounded-ss-sm p-4 shadow-xl cyber-border-subtle flex flex-col gap-3">
                {segments.map((seg, i) =>
                  seg.type === 'text' ? (
                    <p
                      key={i}
                      className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap"
                      dir="auto"
                    >
                      {seg.text}
                    </p>
                  ) : (
                    <CodeBlockCard
                      key={i}
                      language={seg.block.language}
                      filename={seg.block.filename}
                      code={seg.block.code}
                    />
                  )
                )}
              </div>

              {/* Feedback & Share Row */}
              <div className="flex items-center gap-1.5 px-1">
                <button
                  type="button"
                  onClick={() => toggleReaction(msg.id, 'up')}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    msg.liked === 'up'
                      ? 'bg-primary-container/20 text-primary-container'
                      : 'bg-surface-container-high text-outline hover:text-on-surface'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleReaction(msg.id, 'down')}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    msg.liked === 'down'
                      ? 'bg-error-container/40 text-error'
                      : 'bg-surface-container-high text-outline hover:text-on-surface'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => shareText('Gemini Code Reply', msg.content)}
                  className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                {msg.tokensUsed && (
                  <span className="font-mono text-[10px] text-outline ms-1" dir="ltr">
                    {msg.tokensUsed} tok
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming Partial Bubble */}
        {isGenerating && (
          <div className="flex flex-col items-start gap-1.5 me-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-xs text-primary-container">
                {t('در حال استریم پاسخ...', 'Streaming response...')}
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-2xl p-4 shadow-xl cyber-glow-cyan">
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap" dir="auto">
                {streamingText || t('در حال پردازش زمینه مخزن و کد...', 'Analyzing code context...')}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sticky Bottom Prompt Composer */}
      <div className="sticky bottom-18 z-30 pt-2 bg-gradient-to-t from-surface via-surface/95 to-transparent">
        <div className="bg-surface-container-high rounded-2xl p-2 shadow-2xl cyber-border flex items-end gap-2 focus-within:cyber-glow-cyan transition-all">
          <button
            type="button"
            onClick={() => setAttachRepo((v) => !v)}
            title={t('پیوست زمینه مخزن فعال', 'Toggle repository context')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all ${
              attachRepo
                ? 'bg-primary-container/20 text-primary-container'
                : 'bg-surface-container-highest text-outline'
            }`}
          >
            <Code2 className="w-5 h-5" />
          </button>

          <textarea
            value={input}
            dir={inputDir}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={t(
              'سوال کدنویسی بپرسید یا قطعه کد وارد کنید...',
              'Ask a coding question or paste code...'
            )}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-on-surface placeholder:text-outline py-2 px-1 max-h-28 overflow-y-auto leading-relaxed"
          />

          <button
            type="button"
            disabled={!input.trim() || isGenerating}
            onClick={() => handleSend()}
            className="w-10 h-10 rounded-xl bg-primary-container disabled:opacity-40 text-on-primary-container flex items-center justify-center font-bold active:scale-90 shadow-[0_0_14px_rgba(0,245,212,0.4)] transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] font-mono text-outline">
          <button
            type="button"
            onClick={() => navigate('repos')}
            className="flex items-center gap-1 hover:text-primary-container transition-colors truncate"
            dir="ltr"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-primary-fixed-dim" />
            <span>
              {attachRepo ? `@repo:${selectedRepo.fullName}` : '@repo:detached'}
            </span>
          </button>
          <span>{t('Enter ارسال • Shift+Enter خط جدید', 'Enter to send')}</span>
        </div>
      </div>
    </div>
  );
};
